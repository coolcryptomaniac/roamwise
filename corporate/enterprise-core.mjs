/* Illustrative annual corporate programme scenarios, NOT bookings, approved discounts,
   travel-credit issuance, platform fee quotes or a crypto gateway. All INR before applicable taxes. */
const bounded=(value,min,max,name)=>{
 const n=Number(value);
 if(!Number.isFinite(n)||!Number.isInteger(n)||n<min||n>max)throw new Error(name+' must be between '+min+' and '+max+'.');
 return n;
};
export const ENTERPRISE_DEFAULTS=Object.freeze({
  employees:1000,licensePerSeat:250,
  departmentTrips:4,departmentSize:60,departmentPerHead:12000,
  leadershipTrips:2,leadershipSize:20,leadershipPerHead:25000,
  workationBookings:24,workationPerBooking:20000,
  personalBookings:50,personalPerBooking:15000
});
export function modelEnterprise(input=ENTERPRISE_DEFAULTS){
 const p={
   employees:bounded(input.employees,1,10000,'Employees'),
   licensePerSeat:bounded(input.licensePerSeat,150,300,'Annual licence per employee'),
   departmentTrips:bounded(input.departmentTrips,0,24,'Department retreats'),
   departmentSize:bounded(input.departmentSize,1,1000,'Employees per department retreat'),
   departmentPerHead:bounded(input.departmentPerHead,1000,100000,'Department retreat budget per employee'),
   leadershipTrips:bounded(input.leadershipTrips,0,24,'Leadership retreats'),
   leadershipSize:bounded(input.leadershipSize,1,100,'Leadership group size'),
   leadershipPerHead:bounded(input.leadershipPerHead,1000,200000,'Leadership budget per person'),
   workationBookings:bounded(input.workationBookings,0,10000,'Workation bookings'),
   workationPerBooking:bounded(input.workationPerBooking,1000,300000,'Workation booking budget'),
   personalBookings:bounded(input.personalBookings,0,10000,'Employee personal bookings'),
   personalPerBooking:bounded(input.personalPerBooking,1000,300000,'Personal booking budget')
 };
 if(p.departmentSize>p.employees||p.leadershipSize>p.employees)throw new Error('A retreat group cannot be larger than the company.');
 const license= p.employees*p.licensePerSeat;
 const segments=[
   {id:'department',name:'Department offsites',bookings:p.departmentTrips,peoplePerBooking:p.departmentSize,
     value:p.departmentTrips*p.departmentSize*p.departmentPerHead},
   {id:'leadership',name:'Leadership retreats',bookings:p.leadershipTrips,peoplePerBooking:p.leadershipSize,
     value:p.leadershipTrips*p.leadershipSize*p.leadershipPerHead},
   {id:'workation',name:'Remote workations',bookings:p.workationBookings,peoplePerBooking:null,
     value:p.workationBookings*p.workationPerBooking},
   {id:'personal',name:'Personal employee trips',bookings:p.personalBookings,peoplePerBooking:null,
     value:p.personalBookings*p.personalPerBooking}
 ];
 const bookingValue=segments.reduce((sum,x)=>sum+x.value,0);
 return {inputs:p,licenseFee:license,bookingValue,projectedClientSpend:license+bookingValue,
   segments,minimumBookingContributionGoal:Math.round(bookingValue*.1),
   warning:'Travel values assume every illustrative booking happens. Not confirmed revenue or approved pricing.'};
}
