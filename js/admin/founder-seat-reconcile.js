// @ts-nocheck
/* Pure helpers for the one-click admin reconciliation. The public site always
   reads pricing/founder; this tool repairs historical drift without hardcoding
   a displayed number. */
var RWFounderSeatReconcile = (function(){
  function permanentProCount(users){
    /* NMIMS pass holders are reserved in their own pool of 500, so they are not part of this counter. */
    return (users || []).filter(function(user){
      return user && user.pro === true && !(user.proMethod === 'partner' && String(user.proCode || '').indexOf('NMIMS-') === 0);
    }).length;
  }
  function status(users, storedCount, maxSeats){
    var actual = permanentProCount(users), stored = Number.isInteger(storedCount) ? storedCount : null, max = Number(maxSeats) || 1000;
    return {actual:actual, stored:stored, seatsLeft:Math.max(0, max - actual), delta:stored === null ? null : actual - stored, inSync:stored === actual};
  }
  return {permanentProCount:permanentProCount, status:status};
})();
