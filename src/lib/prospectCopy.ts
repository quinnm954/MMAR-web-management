// Trade-specific outreach copy. Mirrors supabase/functions/_shared/prospect-copy.ts (keep in sync).
type Trade = { hook: string; pain: string; example: string; vehicle: string };
const T: Record<string, Trade> = {
  roofing: { vehicle: 'trucks', hook: "Your crew can't shingle a roof from the side of I-75.", pain: "When a truck's down, the whole crew and the material run sit with it.", example: 'Last month I swapped an alternator on a roofing crew\'s F-250 in their yard before 8am. They made their first job on time.' },
  construction: { vehicle: 'trucks', hook: 'A dead work truck on a job site costs more than the repair.', pain: "Every hour it sits, a crew is waiting on tools and materials that aren't coming.", example: 'I recently did brakes on two contractor trucks at their yard on a Saturday. Zero lost workdays.' },
  'used car dealer': { vehicle: 'cars', hook: "Every day a car waits on a starter is a day it isn't on the front line.", pain: 'Sending units out for reconditioning means drivers, delays and cars off the lot.', example: 'I knock out brakes, batteries, starters and check-engine lights right on the lot, so units go front-line faster.' },
  plumbing: { vehicle: 'vans', hook: 'A van down means the next emergency call goes to your competitor.', pain: 'Your techs are your revenue, and they can\'t bill from a repair shop waiting room.', example: 'I did a fuel pump on a plumber\'s van in his driveway the same afternoon he called.' },
  'pest control': { vehicle: 'trucks', hook: "Your route doesn't pause when a truck won't start.", pain: 'One truck in the shop means rescheduled stops and unhappy customers.', example: 'I service route trucks in the lot after hours, so they roll out on schedule the next morning.' },
  electrical: { vehicle: 'vans', hook: 'Your techs fix wiring all day. I fix the vans they drive.', pain: 'A van in the shop is a tech with no truck stock and no billable hours.', example: 'I recently traced a parasitic drain on an electrician\'s van at his shop. Took an hour, no tow.' },
  hvac: { vehicle: 'vans', hook: 'In Florida summer, a down HVAC van is a lost no-AC call.', pain: 'Peak season is the worst time to send a tech across town for an oil change.', example: 'I do oil changes, brakes and A/C on service vans right at your shop, before the season hits.' },
  'cleaning service': { vehicle: 'vehicles', hook: 'Oil changes and brakes done at your lot while your crew is out cleaning.', pain: 'Taking a car to the shop usually means a cancelled client and a crew short-handed.', example: 'I maintain small fleets on-site so nobody has to sit at a dealership for half a day.' },
  landscaping: { vehicle: 'trucks', hook: 'A truck in the shop leaves a mowing route behind schedule.', pain: 'Trailers, crews and routes all stop when one truck does.', example: 'I service landscaping trucks in the yard early morning, before crews head out.' },
};
const pick = (cat: string): Trade => T[String(cat || '').toLowerCase()] ?? { vehicle: 'vehicles', hook: 'When a work vehicle goes down, the work stops with it.', pain: 'Sending it to a shop means drive time, wait time and people off the job.', example: 'I fix work vehicles right at your lot, so your team keeps working.' };

export function prospectEmail(category: string, name: string, step: number) {
  const t = pick(category);
  const hi = `Hi ${name} team,`;
  const sig = `Mike\nMike's Mobile Auto Repair · 813-501-7572`;
  if (step <= 1) return {
    subject: `Quick question about your ${t.vehicle}`,
    body: `${hi}\n\n${t.hook} ${t.pain}\n\nI'm a mobile mechanic in Fort Myers and Lehigh Acres. I come to your yard and do the repair there. First visit I'll do a free check on up to 3 of your ${t.vehicle}.\n\nWorth a 10-minute visit to your yard?\n\n${sig}`,
  };
  if (step === 2) return {
    subject: `Re: Quick question about your ${t.vehicle}`,
    body: `${hi}\n\nDid this get buried? Happy to swing by for that free 3-vehicle check whenever it suits you. Just reply with a day.\n\n${sig}`,
  };
  return {
    subject: `Last note from Mike`,
    body: `${hi}\n\nLast note, I promise. ${t.example}\n\nIf that would help you, reply "yes" and I'll text you to set a time. If not, no worries. I won't email again.\n\n${sig}`,
  };
}
