define([
  "module",
  "pentaho/visual/base/view",
  "./model",
  "pentaho/visual/action/execute",
  "pentaho/visual/action/select",
  "d3",
  "css!./css/view-d3"
], function(module, baseViewFactory, barModelFactory, executeActionFactory, selectActionFactory, d3) {

  "use strict";

  return function(context) {

    var BaseView = context.get(baseViewFactory);

    var BarView = BaseView.extend({
      type: {
        id: module.id,
        props: [
          {
            name: "model",
            type: barModelFactory
          }
        ]
      },
      
_updateAll: function() {
  // Part 1
  
  var model = this.model;
  var dataTable = model.data;

  var timeAttribute = model.Event.attributes.at(0).name;
  var statusAttribute = model.Status.attributes.at(0).name;
  var cohortAttribute = model.Cohort.attributes.at(0).name;

  var timeColumn = dataTable.getColumnIndexByAttribute(timeAttribute);
  var statusColumn = dataTable.getColumnIndexByAttribute(statusAttribute);
  var cohortColumn = dataTable.getColumnIndexByAttribute(cohortAttribute);

//Moving before scenes for that logic
  var margin = {top: 50, right: 20, bottom: 30, left: 75};
  var width  = this.width  - margin.left - margin.right;
  var height = this.height - margin.top  - margin.bottom;

  var scenes = this.__buildScenes(dataTable, timeColumn, statusColumn, cohortColumn);
    
  var container = d3.select(this.domContainer);
    
  container.selectAll("*").remove();


//Modifying for ECDF X and Y axis
  var x = d3.scaleLinear().rangeRound([width, 0]);
  var y = d3.scaleLinear().rangeRound([height, 0]);

  x.domain([dataTable.getFormattedValue(dataTable.getNumberOfRows()-1,timeColumn),0]); //using plotTime, because extra endpoint has the final x value-- TODO make sure it is the biggest of either cohort
  //x.domain(dataTable[timeColumn][dataTable.getNumberOfRows()],0]);
    
  y.domain([0, d3.max(scenes, function(d) { return d.plotSurvival; })]);

  var svg = container.append("svg")
      .attr("width",  this.width)
      .attr("height", this.height);

  // Title
  
  var c0 = dataTable.getFormattedValue(0,cohortColumn);
  var c1 = '';

/*
  for (var c=0;c<dataTable.getNumberOfRows();c++){
    if (c0 != dataTable.getFormattedValue(c,cohortColumn)){
      c1 = dataTable.getFormattedValue(c,cohortColumn)
    }
  }
  
  svg.append("text")
      .text(c0 + ' versus '+ c1)   
      .attr("dy", "0.4em") 
      .attr("color","blue")      
      .attr("class", "title")
      .attr("y", margin.top / 2);
      //.attr("x", this.width / 2);

  svg.append("text")
      .text("versus")
      .attr("dy", "0.35em")
      .attr("color","black")      
      .attr("class", "title")
      .attr("y", margin.top / 2);
      //.attr("x", this.width / 2);


  svg.append("text")
      .text(c1)
      .attr("dy", "0.4em")
      .attr("color","red")      
      .attr("class", "title")
      .attr("y", margin.top / 2);
      //.attr("x", this.width / 2);
*/

  // Content
  var g = svg.append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  // X axis
  g.append("g")
      .attr("class", "axis axis-x")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x));

  // Y axis
  g.append("g")
      .attr("class", "axis axis-y")
      .call(d3.axisLeft(y).ticks(10));

/*  var events = g.selectAll(".event")
      .data(scenes)
      .enter().append("svg:circle")
      .attr("cx", function(d) {return x(d.plotTime)} )
      .attr("cy", function(d) {return y(d.plotSurvival)} )
      .attr("r", function(d) {return d.plotType})
      attr("stroke", function(d) {return d.plotColor} );
*/

  var events = g.selectAll(".event")
      .data(scenes)
      .enter().append("svg:rect")
      .attr("x", function(d) {return x(d.plotTime)-2} )
      .attr("y", function(d) {return y(d.plotSurvival)-2} )
      .attr("width", function(d) {return d.plotType})
      .attr("height", function(d) {return d.plotType})
      .attr("stroke", function(d) {return d.plotColor})
      .attr("fill", function(d) {return d.plotColor})  
      .attr("stroke-opacity",function(d){return d.plotType/4});

  var line = g.selectAll(".lines") //putting second so... the furthest x2 is included?
      .data(scenes)
      .enter().append("line")
      .attr("x1", function(d) {return x(d.plotTime)} )
      .attr("y1", function(d) {return y(d.plotSurvival)} )
      .attr("x2", function(d) {return x(d.plotTime1)} )
      .attr("y2", function(d) {return y(d.plotSurvival1)} )     
      .attr("stroke-width",1)
      .attr("stroke", function(d) {return d.plotColor} )
      .attr("stroke-opacity", 1);


      //TODO: could add logic to not draw redundant lines

//Event Section

}, //End Update All

__buildScenes: function(dataTable, timeColumn, statusColumn, cohortColumn){//, w, h) {
  
  var scenes = [];
  var observations = dataTable.getNumberOfRows();
  var dead = 0;
  var newlyDead = 0;
  var counterTime = 0;


  var color = 'blue';
  var cohort = dataTable.getFormattedValue(0, cohortColumn);

  //Cycle through all the data, then determine what to push to the scene
  for (var i=0; i<observations;i++){

    //if the 2nd cohort
    if(cohort != dataTable.getFormattedValue(i, cohortColumn)){
        //do the final line for the 1st cohort

        scenes.push({
          plotTime : counterTime,
          plotSurvival : 100*(observations-dead-newlyDead)/observations,
          plotType : '0'
          ,plotTime1 : dataTable.getFormattedValue(i-1, timeColumn) // needs to grab the time stamp of the last record of the 1st cohort
          ,plotSurvival1 : 100*(observations-dead-newlyDead)/observations
          ,plotColor: color
        })

    //now need to set everything and process as normal
    dead = 0;
    newlyDead = 0;
    counterTime = 0;
    color = 'red';
    cohort = dataTable.getFormattedValue(i, cohortColumn);
    }


    //if delta time
    if(dataTable.getFormattedValue(i, timeColumn) > counterTime){
      dead += newlyDead;
      newlyDead = 0;
      
      scenes.push({
        plotTime : counterTime,
        plotSurvival : 100*(observations-dead)/observations,
        plotType : '0'
        ,plotTime1 : dataTable.getFormattedValue(i, timeColumn)
        ,plotSurvival1 : 100*(observations-dead)/observations
        ,plotColor: color
      })

      counterTime = dataTable.getFormattedValue(i, timeColumn);

    } // end if delta time

    //if observation then mark at high Y
    if(dataTable.getFormattedValue(i, statusColumn) == 1){
      scenes.push({
        plotTime : counterTime,
        plotSurvival : 100*(observations-dead)/observations,
        plotType : '4'
        ,plotTime1 : counterTime
        ,plotSurvival1 : 100*(observations-dead)/observations 
        ,plotColor: color
      })
    }else if(dataTable.getFormattedValue(i, statusColumn) == 0){
      //testing to see if I can remove the redundant lines for verticals
      scenes.push({
        plotTime : counterTime,
        plotSurvival : 100*(observations-dead-newlyDead)/observations,
        plotType : '0'
        ,plotTime1 : counterTime
        ,plotSurvival1 : 100*(observations-dead-newlyDead-1)/observations //this will plot a vertical line for the dead running count, which SHOULD include the end point
        ,plotColor: color
      }) 
      newlyDead ++; 
    }

      if(i==observations-1){
        
        scenes.push({
          plotTime : counterTime,
          plotSurvival : 100*(observations-dead-newlyDead)/observations,
          plotType : '0'
          ,plotTime1 : dataTable.getFormattedValue(i, timeColumn)
          ,plotSurvival1 : 100*(observations-dead-newlyDead)/observations //this will plot a vertical line for the dead running count, which SHOULD include the end point
          ,plotColor: color
        })
      }

  }//end looping for the rows of data

  return scenes;
}


  });

    return BarView;
  };
});