function getReconcileClanCacheExpiration() {
  return new CacheExpiration("ReconcileClan", 2*60*60);
}

function getReconcileRanksCacheExpiration() {
  return new CacheExpiration("ReconcileRanks", 2*60*60);
}

function CacheExpiration(key, timeoutSeconds) {
  this.key = key;
  this.timeout = timeoutSeconds;
  
  this.set = function() {
    var cache = CacheService.getDocumentCache();
    cache.put(this.key, new Date().getTime(), this.timeout);
  }
  
  this.expired = function() {
    var cache = CacheService.getDocumentCache();
    var cachedTime = cache.get(this.key);
    if ( cachedTime == null )
      return true;
    var elapsedMsec = new Date().getTime() - parseInt(cachedTime);
    return elapsedMsec > this.timeout*1000;
  }
}
