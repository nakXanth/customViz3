define([
  "module",
  "pentaho/visual/base"
], function(module, baseModelFactory) {
  
  "use strict";
  
  return function(context) {
    
    var BaseModel = context.get(baseModelFactory);
    
    var BarModel = BaseModel.extend({
      type: {
        id: module.id,
        styleClass: "pentaho-visual-samples-bar",
        label: "Cohort Compairison ECDF",
        defaultView: "./view",
        props: [
          {
            name: "Event",
            type: {
              base: "pentaho/visual/role/ordinal"
            }
          },
          {
            name: "Status",
            type: {
              base: "pentaho/visual/role/nominal"
            }
          },
          {
            name: "Cohort",
            type: {
              base: "pentaho/visual/role/ordinal"
            }
          }                   
        ]
      }
    });
    
    return BarModel;
  };
});