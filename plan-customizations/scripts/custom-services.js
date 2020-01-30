/* global angular, moment, dhis2 */

'use strict';

/* Services */

/**
 * Created by hisp on 09/08/2018.
 */

angular.module('trackerCaptureServices')


    .service('CustomIDGenerationService',function($http,$q,ProgramFactory,RegistrationService,CustomIdService){

        return {
            getOu: function (ou) {
                var def = $q.defer();
                $http.get('../api/organisationUnits/' + ou.id + ".json?fields=id,name,code,parent[id],attributeValues[attribute[id,name,code],value]").then(function (response) {

                    def.resolve(response.data);
                });
                return def.promise;
            },
            getCurrentToRootAttributeValue: function (ou, result, def) {
                var promise = this.getOu(ou);
                var thiz = this;
                promise.then(function (ou) {

                        for (var i=0;i<ou.attributeValues.length;i++){
                            if (ou.attributeValues[i].attribute.code == "facilityCode"){
                                result =   ou.attributeValues[i].value  + result;
                            }
                        }
                    result =  ":"+result;

                    if (ou.parent == undefined) {
                        def.resolve(result);
                        return;
                    } else {
                        return thiz.getCurrentToRootAttributeValue(ou.parent, result, def);
                    }
                });
                return def.promise();
            },
           
            createCustomId :  function(regDate,totalTeiCount,orgUnitCode,projectDonner, sqlViewNameToUIDMap, orgUnitUid, programUid ){

                var thisDef = $.Deferred();

                var constantPreFix = "PLAN";
                var prefix = "";
                var attributeValueList = [];
                
                //console.log( "total Count -- " + response.data.height);
                //var totalTei = response.data.height + 1;
                CustomIdService.getTeiAttributeValues(sqlViewNameToUIDMap['TEI_ID_VALIDATION'], orgUnitUid, programUid ).then(function(attributeValues){
                    for(var i=0;i<attributeValues.rows.length;i++)
                    {
                        attributeValueList.push(attributeValues.rows[i][0]);
                    }

                    var totalTei = totalTeiCount;
                    // for Reset after count 9999
                    //totalTei = 10000;
                    totalTei = totalTei%10000;

                    if( totalTei == 0 ) totalTei = 1;
                    if( totalTei <10) prefix="0000";
                    else if (totalTei >9 && totalTei<100) prefix="000";
                    else if(totalTei>99 && totalTei<1000) prefix="00";
                    else if(totalTei>999 && totalTei<10000) prefix="0";

                    // change in requirement - adding random number
                    //prefix=Math.floor(Math.random()*(9999-1000) + 1000);
                    //def.resolve(constant + prefix + totalTei );
                    //Math.floor(Math.random() * (max - min + 1) ) + min;
                    prefix = Math.floor(Math.random() * (999999 - 100000 + 1) ) + 100000;

                    //var finalCustomId = constantPreFix + "-" + projectDonner + "-"  + regDate + "-" + prefix + totalTei;
                    //var finalCustomId = constantPreFix + "-" + projectDonner + "-"  + regDate + "-" + prefix;
                    var finalCustomId = constantPreFix + "-" + projectDonner + "-" + prefix;
                    //thisDef.resolve(finalCustomId);

                    CustomIdService.getUniqueCustomId( finalCustomId, attributeValueList, prefix).then(function(uniqueCustomId){
                        finalCustomId = uniqueCustomId;

                        thisDef.resolve(finalCustomId);

                    });

                    /*

                    def.then(function(currentToRootOrgunitCodes){
                        var referenceLevel = 6;
                        var codes = currentToRootOrgunitCodes.split(":");
                        var level2Code = "00";
                        var level5code = "0000";
                        var level6code = "00";
                        var randomNo =  Math.floor(Math.random()*(99999-10000) + 10000);
                        if (codes[referenceLevel-4]){
                            level2Code = codes[referenceLevel-4].substr(0,2);
                        }
                        if (codes[referenceLevel-1]){
                            level5code = codes[referenceLevel-1].substr(0,4);
                        }
                        if (codes[referenceLevel]){
                            level6code = codes[referenceLevel].substr(0,2);
                        }

                        var Id = level2Code+ level5code+ level6code+ randomNo;
                        thisDef.resolve(Id);
                    })

                     function random (low, high) {
                     return Math.random() * (high - low) + low;

                     */
                });
                return thisDef;

            }, 
           
            createCustomIdAndSave: function(tei,customIDAttribute,optionSets,attributesById,regDate,totalTeiCount,orgUnitCode,projectDonner, sqlViewNameToUIDMap, programUid){
                var def = $.Deferred();
                console.log( regDate +"--"+ totalTeiCount + "--" + orgUnitCode);
                var orgUnitUid = tei.orgUnit;
                this.createCustomId(regDate,totalTeiCount,orgUnitCode,projectDonner, sqlViewNameToUIDMap, orgUnitUid, programUid ).then(function(customId){
                    var attributeExists = false;
                    angular.forEach(tei.attributes,function(attribute){
                        if (attribute.attribute == customIDAttribute.id){
                            attribute.value = customId;
                            attributeExists = true;
                        }
                    });

                    if (!attributeExists) {
                        customIDAttribute.value = customId;
                        tei.attributes.push(customIDAttribute);
                    }

                    //var teI = {
                    //    "trackedEntity": tei.trackedEntityInstance,
                    //    "orgUnit": tei.orgUnit,
                    //    "attributes": tei.attributes
                    //};
                    RegistrationService.registerOrUpdate(tei,optionSets,attributesById).then(function(response){
                        if (response.response.status == "SUCCESS"){
                            //alert("Beneficiary Id : " + customId);
                            def.resolve(response.response);
                        }
                        else{
                            def.resolve(response.response);
                        }
                    })
                });

                return def;
            },
            validateAndCreateCustomId : function(tei,programUid,tEAttributes,destination,optionSets,attributesById,enrolmentdate,projectDonner) {
                var def = $.Deferred();
                var thiz = this;
                var customIDAttribute;
                var isValidProgram = false;
                var isValidAttribute = false;
                if (destination == 'PROFILE' || !destination || !programUid){
                    def.resolve("Not Needed");
                    return def;
                }
                //ProgramFactory.get(programUid).then(function(program) {
                CustomIdService.getProgramAttributeAndValue(programUid).then(function(data){
                    if( data.attributeValues != undefined )
                    {
                        for (var i=0;i<data.attributeValues.length;i++)
                        {
                            if (data.attributeValues[i].attribute.code == 'allowRegistration' && data.attributeValues[i].value == "true"){
                                isValidProgram = true; break;
                            }
                        }
                    }

                    CustomIdService.getTEAttributesAttributeAndValue().then(function(tea) {
                        if( tea.trackedEntityAttributes != undefined )
                        {
                            for (var j=0;j<tea.trackedEntityAttributes.length;j++)
                            {
                                if( tea.trackedEntityAttributes[j].attributeValues != undefined )
                                {
                                    for (var k=0;k<tea.trackedEntityAttributes[j].attributeValues.length;k++)
                                    {
                                        if (tea.trackedEntityAttributes[j].attributeValues[k].attribute.code == 'toBeUsedForCustomID' && tea.trackedEntityAttributes[j].attributeValues[k].value == "true")
                                        {
                                            isValidAttribute = true;
                                            customIDAttribute = {
                                                attribute : tea.trackedEntityAttributes[j].id,
                                                displayName : tea.trackedEntityAttributes[j].name,
                                                valueType : tea.trackedEntityAttributes[j].valueType,
                                                value : ""
                                            };
                                            break;
                                        }
                                    }
                                }
                            }
                        }

                        if (isValidAttribute && isValidProgram)
                        {
                            var regDate = enrolmentdate;
                            var orgUnitUid = tei.orgUnit;
                            //var customRegDate = regDate.split("-")[2]+regDate.split("-")[1]+regDate.split("-")[0];
                            var customRegDate = regDate.split("-")[0];
                            CustomIdService.getALLSQLView().then(function( responseSQLViews ){
                                var sqlViewNameToUIDMap = [];
                                for(var i=0; i<responseSQLViews.sqlViews.length; i++)
                                {
                                    sqlViewNameToUIDMap[responseSQLViews.sqlViews[i].displayName]=responseSQLViews.sqlViews[i].id;
                                }
                                //CustomIdService.getTotalTeiByProgram(programUid).then(function(teiResponse){
                                var totalTei = "";
                                //var count = teiResponse.rows[0];
                                //var countTeiByProgram = count[0];
                                //var totalTei = countTeiByProgram;
                                    CustomIdService.getOrgunitCode(tei.orgUnit).then(function(orgUnitCodeResponse){
                                    var orgUnitCode = orgUnitCodeResponse.code;
                                    thiz.createCustomIdAndSave(tei,customIDAttribute,optionSets,attributesById,customRegDate,totalTei,orgUnitCode,projectDonner, sqlViewNameToUIDMap, programUid ).then(function(customIdResponse){
                                    //thiz.createCustomId(regDate,totalTei,orgUnitCode,projectDonner, sqlViewNameToUIDMap, orgUnitUid, programUid ).then(function( generatedCustomId ){
                                        console.log( " 1 " + customIdResponse );
                                            def.resolve( customIdResponse );
                                        });
                                    });
                                });
                            //});

                        }
                        else
                        {
                            def.resolve("Validation Failed");
                        }


                    });

                });

                    /*
                    var promise = this.getProgramAttributeAndValue(program);
                    if( program.attributeValues != undefined )
                    {
                        for (var i=0;i<program.attributeValues.length;i++)
                        {
                            if (program.attributeValues[i].attribute.code == 'allowRegistration' && program.attributeValues[i].value == "true"){
                                isValidProgram = true; break;
                            }
                        }
                    }

                    angular.forEach(tEAttributes, function (tEAttribute) {
                        if( tEAttribute.attributeValues != undefined )
                        {
                            for (var j=0;j<tEAttribute.attributeValues.length;j++)
                            {
                                if (tEAttribute.attributeValues[j].attribute.code == 'toBeUsedForCustomID' && tEAttribute.attributeValues[j].value == "true") {
                                    isValidAttribute = true;
                                    customIDAttribute = {
                                        attribute : tEAttribute.id,
                                        displayName : tEAttribute.name,
                                        type : tEAttribute.valueType,
                                        value : ""
                                    };
                                    break;
                                }
                            }
                        }

                    });
                    */
                return def;
            }
        }
    })

    /*
    .service('ProgramStageSequencingService',function(CalendarService,$filter,orderByFilter) {
        return {
            updateCurrentEventAfterDataValueChange: function(currentEvent,dataValue){
                var isDePresent = false;

                if (!currentEvent.dataValues){
                    currentEvent.dataValues = [];
                }
                for (var i=0;i< currentEvent.dataValues.length;i++){
                    if (currentEvent.dataValues[i].dataElement == dataValue.dataElement){
                        currentEvent.dataValues[i].value = dataValue.value;
                        isDePresent = true;
                    }
                }

                if (!isDePresent){

                    currentEvent.dataValues.push(dataValue);
                }
            },
            getTargetStage : function(programStages,stagesById,currentStage){
                
                for (var i=0; i < programStages.length; i++){
                    if (programStages[i].sortOrder == (currentStage.sortOrder % programStages.length)+1){
                        return programStages[i];
                    }
                }
                return currentStage;
            },
            addOffsetAndFormatDate : function(referenceDate,offset){
                var calendarSetting = CalendarService.getSetting();

                var date = moment(referenceDate, calendarSetting.momentFormat).add('d', offset)._d;
                date = $filter('date')(date, calendarSetting.keyDateFormat);
                
                return date;
            },
            applySequencingOperationIfStageFlagged: function (dummyEvent,currentEvent,eventsByStage,programStages,stagesById,prStDes,currentStage) {

                // initial checking for null values - happens when no events exist
                if (!currentEvent || !currentStage)
                    return dummyEvent;

                var isStageSequencingEnabled = false;
                var isDeValid = false;
                var customTimeInterval = null;
                var isCustomTimeIntervalEnabled = false;
                var targetProgramStage = this.getTargetStage(programStages,stagesById,currentStage);


                //check if stage is valid
                for (var stageIndex=0;stageIndex<currentStage.attributeValues.length;stageIndex++){
                    if (currentStage.attributeValues[stageIndex].attribute.code == "isStageSequencingEnabled" && currentStage.attributeValues[stageIndex].value == "true"){
                        isStageSequencingEnabled = true;
                    }
                    if (currentStage.attributeValues[stageIndex].attribute.code == "isCustomTimeIntervalEnabled" && currentStage.attributeValues[stageIndex].value == "true"){
                        isCustomTimeIntervalEnabled  = true;
                    }
                    if (currentStage.attributeValues[stageIndex].attribute.code == "customTimeInterval" && currentStage.attributeValues[stageIndex].value ){
                        customTimeInterval  = currentStage.attributeValues[stageIndex].value;
                    }

                }
                
                if (isCustomTimeIntervalEnabled ){
                    if (currentStage.periodType || !customTimeInterval){
                        return dummyEvent;
                    }
                        var timeRange = customTimeInterval.split("-");
                        var evs = eventsByStage[currentStage.id];

                        evs = orderByFilter(evs, '-eventDate');
                        dummyEvent.dueDate = this.addOffsetAndFormatDate(evs[0].eventDate,timeRange[evs.length] ? timeRange[evs.length] : 0);
                    return dummyEvent;
                }
                
               
                if (!isStageSequencingEnabled || !currentEvent.dataValues){
                    return dummyEvent;
                }

                for (var dataValueIndex=0;dataValueIndex<currentEvent.dataValues.length;dataValueIndex++){
                    for (var dataElementAttributeValueIndex=0;dataElementAttributeValueIndex<prStDes[currentEvent.dataValues[dataValueIndex].dataElement].dataElement.attributeValues.length;dataElementAttributeValueIndex++){
                        if (prStDes[currentEvent.dataValues[dataValueIndex].dataElement].dataElement.attributeValues[dataElementAttributeValueIndex].attribute.code == "stageSequencingSkipLogicDataValue" &&
                            prStDes[currentEvent.dataValues[dataValueIndex].dataElement].dataElement.attributeValues[dataElementAttributeValueIndex].value == currentEvent.dataValues[dataValueIndex].value){
                            isDeValid = true;
                        }
                    }
                }

                if (isDeValid){
                    dummyEvent.programStage = targetProgramStage.id;
                    dummyEvent.name = targetProgramStage.name;
                    dummyEvent.reportDateDescription = targetProgramStage.reportDateDescription;

                    if (!targetProgramStage.periodType){
                        dummyEvent.dueDate = this.addOffsetAndFormatDate(currentEvent.eventDate,targetProgramStage.standardInterval ?  targetProgramStage.standardInterval : 0);
                    }
                }

                return dummyEvent;
            }


        }
    })

*/
// New Service for CustomId
//http://127.0.0.1:8090/dhis/api/programs/y6lXVg8TdOj.json?fields=id,name,code,attributeValues[attribute[id,name,code],value]&paging=false
//http://127.0.0.1:8090/dhis/api/trackedEntityAttributes.json?fields=id,name,valueType,attributeValues[attribute[id,name,code],value]&paging=false
//var url =  'http://127.0.0.1:8090/dhis/api/trackedEntityInstances.json?program=y6lXVg8TdOj&ouMode=ALL;
//127.0.0.1:8090/dhis/api/organisationUnits/sGXSQmbYeMk.json?fields=id,name,code,parent[id],attributeValues[attribute[id,name,code],value]&paging=false
.service('CustomIdService',  function ($http,  $q){
    return {
        /*
        getAllReportConfiguration: function () {
            var promise = $http.get('../api/systemSettings/reportApp-configuration-json').then(function (response) {
                return response.data ;
            });
            return promise;
        },

        saveReportConfiguration: function (configuration) {
            var reportConfigurationJson = JSON.stringify(configuration);
            var promise = $http.post('../api/systemSettings/reportApp-configuration-json?value=' + reportConfigurationJson, '', {headers: {'Content-Type': 'text/plain;charset=utf-8'}}).then(function (response) {
                return response.data;
            });
            return promise;
        },
        deleteReportConfiguration: function(){
            var promise = $http.delete('../api/systemSettings/reportApp-configuration-json').then(function (response) {
                return response.data ;
            });
            return promise;
        }
        */

        getProgramAttributeAndValue: function ( programUid ) {
            var def = $q.defer();
            $http.get('../api/programs/' + programUid + ".json?fields=id,name,code,attributeValues[attribute[id,name,code],value]&paging=false").then(function (response) {

                def.resolve(response.data);
            });
            return def.promise;
        },

        getTEAttributesAttributeAndValue: function () {
            var def = $q.defer();
            $http.get('../api/trackedEntityAttributes.json?fields=id,name,valueType,attributeValues[attribute[id,name,code],value]&paging=false').then(function (response) {

                def.resolve(response.data);
            });
            return def.promise;
        },
        /*
        getTotalTeiByProgram: function ( programUid ) {
            var def = $q.defer();
            $http.get('../api/trackedEntityInstances.json?program=' + programUid + "&ouMode=ALL&skipPaging=true").then(function (response) {

                def.resolve(response.data);
            });
            return def.promise;
        },
        */


        getTotalTeiByProgram: function ( programUid ) {
            var def = $q.defer();
            var basicUrl = "../api/sqlViews/";
            var id = 'CxJERywgrmU';
            
            var url3 = basicUrl + id + "/data.json?";
            url3 += "var=programUid:" + programUid;
            $.get(url3, function (data) {

                def.resolve(data.listGrid);
              
               
            });
            return def.promise;
          //  $http.get('../api/trackedEntityInstances.json?fields=trackedEntityInstance&program=' + programUid + "&ouMode=ALL&skipPaging=true").then(function (response) {

        //         def.resolve(response.data);
        //     });
        //     return def.promise;
         },
        getOrgunitCode: function ( orgUnitUid ) {
            var def = $q.defer();
            $http.get('../api/organisationUnits/' + orgUnitUid + ".json?fields=id,name,code,parent[id],attributeValues[attribute[id,name,code],value]&paging=false").then(function (response) {

                def.resolve(response.data);
            });
            return def.promise;
        },
        getALLSQLView : function(){
            var def = $.Deferred();

            $.ajax({
                type: "GET",
                dataType: "json",
                contentType: "application/json",
                async:false,
                url: '../api/sqlViews.json?paging=false',
                success: function (data) {
                    def.resolve(data);
                }
            });
            return def;
        },

        getTeiAttributeValues : function(sqlViewUID, orgUnitUid, programUID ){
            var def = $.Deferred();
            var param = "var=orgUnitUid:" + orgUnitUid + "&var=programUid:" + programUID;
            $.ajax({
                type: "GET",
                dataType: "json",
                async:false,
                contentType: "application/json",
                url: '../api/sqlViews/'+sqlViewUID+"/data?"+param+"&paging=false",
                success: function (data) {
                    def.resolve(data.listGrid);
                }
            });
            return def;
        },
        getUniqueCustomId : function( finalCustomId, attributeValues, prefix ){
            var tempThis = this;
            var def = $.Deferred();
            var tempCount = attributeValues.indexOf( finalCustomId );
            if( tempCount === -1 )
            {
                def.resolve(finalCustomId);
                return def;
            }
            else
            {
                var newPrefix = Math.floor(Math.random() * (999999 - 100000 + 1) ) + 100000;
                var splitString = finalCustomId.split('-');
                var tempFinalCustomId = splitString[0]+"-"+splitString[1]+"-" + newPrefix;
                return tempThis.getUniqueCustomId( tempFinalCustomId, attributeValues, prefix );
            }
        }
    };
})


.service('HideProgramFromDashboardService', function(){
    return {
        isProgramToBeUsedForRegistration : function(program){

            for(var i=0;i < program.attributeValues.length;i++){
                if (program.attributeValues[i].attribute.code == "allowRegistration" && program.attributeValues[i].value == "true"){
                    return true;
                }
            }
            return false;
        }
    }
});
