/* Advisory Google Cloud budget policy; cannot cap Google Cloud invoices.
 * Do not confuse estimated spend or budget emails with authoritative billing.
 */
export const FIREBASE_MONTHLY_BUDGET_USD=10;
export const FIREBASE_OPERATING_TARGET_USD=5;
export const FIREBASE_ALERT_THRESHOLDS_USD=Object.freeze([2.5,5,7.5,9]);
export function evaluateFirebaseCost({actualUsd,forecastUsd,reportAgeHours}={}){
 if(!Number.isFinite(actualUsd)||actualUsd<0||!Number.isFinite(forecastUsd)||forecastUsd<0||!Number.isFinite(reportAgeHours)||reportAgeHours<0)return {status:'unknown',action:'request_verified_billing_data',hardCap:false};
 if(reportAgeHours>24)return {status:'stale',action:'refresh_billing_data',hardCap:false};
 const observed=Math.max(actualUsd,forecastUsd);
 if(observed>=9)return {status:'critical',action:'pause_optional_google_cloud_jobs_and_escalate',hardCap:false};
 if(observed>=7.5)return {status:'high',action:'disable_nonessential_google_cloud_usage_and_alert',hardCap:false};
 if(observed>=5)return {status:'watch',action:'investigate_growth_and_reduce_optional_usage',hardCap:false};
 return {status:'within_target',action:'monitor',hardCap:false};
}
