import test from 'node:test';
import assert from 'node:assert/strict';
import { notification, deliverNotification } from '../server/rsvp-notification.mjs';
const submission = {id:'test-submission-123',form_name:'wedding-rsvp',data:{name:'Test <Guest>',email:'guest@example.com',attendance:'yes',guests:'2',message:'Love & joy <script>bad()</script>'}};
const env={RESEND_API_KEY:'test-key-not-real',RESEND_FROM_EMAIL:'Wedding <rsvp@example.com>'};
test('both recipients receive escaped message; reply goes to guest',()=>{
 const mail=notification(submission,env.RESEND_FROM_EMAIL);
 assert.deepEqual(mail.body.to,['bolajiosakuade@yahoo.com','Orilionxyz@gmail.com']);
 assert.equal(mail.body.reply_to,'guest@example.com');
 assert.ok(mail.body.html.includes('Your wedding invitation reply'));assert.ok(mail.body.text.includes('Your wedding invitation reply'));assert.ok(mail.body.html.includes('&lt;script&gt;'));assert.ok(!mail.body.html.includes('<script>'));
 assert.ok(mail.body.text.includes('Love & joy'));assert.ok(mail.body.text.includes('No of Person(s) Attending: 2'));
 assert.equal(mail.key,notification(submission,env.RESEND_FROM_EMAIL).key);
});
test('declines record zero guests; unrelated forms and honeypots are ignored',()=>{
 assert.ok(notification({...submission,data:{...submission.data,attendance:'no'}},'sender').body.text.includes('No of Person(s) Attending: 0'));
 assert.equal(notification({...submission,form_name:'other'},'sender'),null);
 assert.equal(notification({...submission,data:{...submission.data,'bot-field':'spam'}},'sender'),null);
});
test('missing credentials fail without sending',async()=>{
 await assert.rejects(deliverNotification(submission,{env:{},fetchImpl:()=>assert.fail('must not send')}),/RESEND_API_KEY/);
});
test('transient errors retry with the same idempotency key',async()=>{
 const requests=[];
 const result=await deliverNotification(submission,{env,sleep:async()=>{},fetchImpl:async(url,options)=>{
  requests.push({url,options});return requests.length===1?new Response('',{status:503}):Response.json({id:'email-test'});
 }});
 assert.equal(result.emailId,'email-test');assert.equal(requests.length,2);
 assert.equal(requests[0].options.headers['Idempotency-Key'],requests[1].options.headers['Idempotency-Key']);
});
test('permanent provider failure is surfaced, not reported as successful',async()=>{
 let calls=0;
 await assert.rejects(deliverNotification(submission,{env,fetchImpl:async()=>{calls++;return new Response('',{status:403})}}),/HTTP 403/);
 assert.equal(calls,1);
});
