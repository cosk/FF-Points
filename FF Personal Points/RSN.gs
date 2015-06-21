var RSN = {
  get: function() {
    return PropertiesService.getUserProperties().getProperty("RSN");
  },
  
  set: function(rsn) {
    PropertiesService.getUserProperties().setProperty("RSN", rsn);
  },
  
  reset: function() {
    PropertiesService.getUserProperties().deleteProperty("RSN");
  },
}
