export function countdown(target, now = Date.now()) {
  const seconds = Math.max(0, Math.floor((new Date(target).getTime() - now) / 1000));
  return [Math.floor(seconds / 86400), Math.floor(seconds / 3600) % 24, Math.floor(seconds / 60) % 60, seconds % 60];
}
export function dateLabel(date) {
  return new Intl.DateTimeFormat('en-GB', { day:'numeric', month:'long', year:'numeric', timeZone:'UTC' }).format(new Date(date+'T12:00:00Z'));
}
const compact = value => new Date(value).toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z/,'Z');
export function calendarUrl(wedding, event) {
  const day=wedding.date.replaceAll('-','');
  const tomorrow=new Date(wedding.date+'T12:00:00Z'); tomorrow.setUTCDate(tomorrow.getUTCDate()+1);
  const dates=event?.start && event?.end ? `${compact(event.start)}/${compact(event.end)}` : `${day}/${tomorrow.toISOString().slice(0,10).replaceAll('-','')}`;
  return 'https://calendar.google.com/calendar/render?'+new URLSearchParams({action:'TEMPLATE',text:`${wedding.couple.first} & ${wedding.couple.second} — ${event?.title || 'Our wedding'}`,dates,details:`${wedding.theme}. ${wedding.siteUrl}${event?.start ? '' : '. Save the date; times to be announced.'}`,location:event?.mapsQuery || wedding.location?.mapsQuery || 'Venue to be announced'});
}
const icsText = value => String(value).replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
export function calendarFile(wedding) {
  const start=wedding.date.replaceAll('-','');
  const end=new Date(wedding.date+'T12:00:00Z');end.setUTCDate(end.getUTCDate()+1);
  return ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Mobolaji and Oyekoya//Wedding//EN','BEGIN:VEVENT',`UID:wedding-${start}@mobolajiandoyekoya.netlify.app`,`DTSTAMP:${compact(new Date())}`,`DTSTART;VALUE=DATE:${start}`,`DTEND;VALUE=DATE:${end.toISOString().slice(0,10).replaceAll('-','')}`,`SUMMARY:${wedding.couple.first} & ${wedding.couple.second} wedding`,`LOCATION:${icsText(wedding.location?.mapsQuery || 'Venue to be announced')}`,`DESCRIPTION:Save the date. Times to be announced. ${wedding.siteUrl}`,'END:VEVENT','END:VCALENDAR',''].join('\r\n');
}
