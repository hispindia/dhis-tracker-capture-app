/* global angular, moment, dhis2 */

'use strict';

/* Services */

/**
 * Created by hisp on 30/12/15.
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
            createCustomId :  function(regDate,totalTeiCount,orgUnitCode, orgUnitUid, sQLViewNameToUidMap, programUID ){

                var thisDef = $.Deferred();

                var date = new Date();
                var year = date.getFullYear();
                var sqlview = [];
                var attributeValueList = [];
                var prefix = "";

                //CustomIdService.getALLSQLView().then(function(responseSQLViews){
                //    for(var i=0;i<responseSQLViews.sqlViews.length;i++)
                //    {
                //        sqlview[responseSQLViews.sqlViews[i].displayName] = responseSQLViews.sqlViews[i].id;
                //    }
                    CustomIdService.getTeiAttributeValues(sQLViewNameToUidMap['TEI_ID_VALIDATION'], orgUnitUid, programUID ).then(function(attributeValues){
                        for(var i=0;i<attributeValues.rows.length;i++)
                        {
                            attributeValueList.push(attributeValues.rows[i][0]);
                        }

                        var totalTei = totalTeiCount;
                        totalTei = totalTei%10000;

                        if( totalTei === 0 ) totalTei = 1;

                        if( totalTei <10) prefix="0000";
                        else if (totalTei >9 && totalTei<100) prefix="000";
                        else if(totalTei>99 && totalTei<1000) prefix="00";
                        else if(totalTei>999 && totalTei<10000) prefix="0";
                        // change in requirement - adding random number
                        //prefix=Math.floor(Math.random()*(9999-1000) + 1000);
                        //def.resolve(constant + prefix + totalTei );

                        var finalCustomId = orgUnitCode +"-" + year + "-"+ prefix + totalTei;

                        CustomIdService.getUniqueCustomId( finalCustomId, attributeValueList, prefix).then(function(uniqueCustomId){
                            finalCustomId = uniqueCustomId;

                            thisDef.resolve(finalCustomId);

                        });
                    });

                //});

                return thisDef;

            },
            createCustomIdAndSave: function(tei,customIDAttribute,optionSets,attributesById,regDate,totalTeiCount,orgUnitCode, sQLViewNameToUidMap, programUid){
                var def = $.Deferred();
                console.log( regDate +"--"+ totalTeiCount + "--" + orgUnitCode);
                var orgUnitUid = tei.orgUnit;
                this.createCustomId(regDate,totalTeiCount,orgUnitCode, orgUnitUid, sQLViewNameToUidMap, programUid ).then(function(customId){
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

                    var teI = {
                        "trackedEntity": tei.trackedEntityInstance,
                        "orgUnit": tei.orgUnit,
                        "attributes": tei.attributes
                    };
                    RegistrationService.registerOrUpdate(tei,optionSets,attributesById).then(function(response){
                        if (response.response.status == "SUCCESS"){
                            //alert("Beneficiary Id : " + customId);
                        }
                        def.resolve(response.data);
                    })


                });

                return def;
            },
            validateAndCreateCustomId : function(tei,programUid,tEAttributes,destination,optionSets,attributesById,enrolmentdate) {
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

                            //var customRegDate = regDate.split("-")[2]+regDate.split("-")[1]+regDate.split("-")[0];
                            var customRegDate = regDate.split("-")[1]+regDate.split("-")[0].slice(-2);



                            CustomIdService.getALLSQLView().then(function( responseSQLViews ){
                                var sqlViewNameToUIDMap = [];
                                for(var i=0; i<responseSQLViews.sqlViews.length; i++)
                                {
                                    sqlViewNameToUIDMap[responseSQLViews.sqlViews[i].displayName]=responseSQLViews.sqlViews[i].id;
                                }
                                CustomIdService.getTeiCountByOrgUnitAndProgramThroughSQLView( sqlViewNameToUIDMap['TEI_COUNT_ORGUNIT_PROGRAM_WISE'], tei.orgUnit, programUid ).then(function(teiResponse){
                                    var countTeiByOrgUnit = teiResponse.rows[0];

                                    var totalTei = countTeiByOrgUnit[0];

                                    CustomIdService.getOrgunitCode(tei.orgUnit).then(function(orgUnitCodeResponse){
                                    var orgUnitCode = orgUnitCodeResponse.code;
                                        thiz.createCustomIdAndSave(tei,customIDAttribute,optionSets,attributesById,customRegDate,totalTei,orgUnitCode, sqlViewNameToUIDMap, programUid ).then(function(response){
                                            def.resolve(response);
                                         });

                                        });

                                    });
							              });
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

        getTotalTeiByProgram: function ( programUid ) {
            var def = $q.defer();
            $http.get('../api/trackedEntityInstances.json?program=' + programUid + "&ouMode=ALL&skipPaging=true").then(function (response) {

                def.resolve(response.data);
            });
            return def.promise;
        },

        getTotalTeiByProgramBySQLView: function ( programUid,data ) {
            var def = $q.defer();
            var basicUrl = "../api/sqlViews/";
			      var id;
			
            var sqlViews = data.sqlViews;
			
              for(var i=0;i<data.sqlViews.length;i++)
              {
                  if(sqlViews[i].name=="Unique Id Generation")
                  {
                      id=sqlViews[i].id;
                  }
              }

            var url3 = basicUrl + id + "/data.json?";
            url3 += "var=programUid:" + programUid;
            $.get(url3, function (data) {

                def.resolve(data);
                      
            });
            return def.promise;
         },
		 
        getAll: function () {
                var promise = $http.get('../api/sqlViews.json?fields=[id,name]&paging=false').then(function (response) {
		
                    return response.data ;
                });
                return promise;
            },
			
		
		    //api/trackedEntityInstances.json?ou=CPtzIhyn36z
        getTotalTeiByOrgUnit: function ( orgUnitId ) {
            var def = $q.defer();
            $http.get('../api/trackedEntityInstances.json?ou=' + orgUnitId + "&skipPaging=true").then(function (response) {

                def.resolve(response.data);
            });
            return def.promise;
        },
        getTotalTeiByProgramAndOrgUnit: function ( programUid,orgUnitId ) {
            var def = $q.defer();
            $http.get('../api/trackedEntityInstances.json?program=' + programUid + '&ou=' + orgUnitId + "&skipPaging=true").then(function (response) {

                def.resolve(response.data);
            });
            return def.promise;
        },
		
        getOrgunitCode: function ( orgUnitUid ) {
            var def = $q.defer();
            $http.get('../api/organisationUnits/' + orgUnitUid + ".json?fields=id,name,code,parent[id],attributeValues[attribute[id,name,code],value]&paging=false").then(function (response) {

                def.resolve(response.data);
            });
            return def.promise;
        },

        getOrgUnitLevel: function ( orgUnitUid ) {
            var def = $q.defer();
            $http.get('../api/organisationUnits/' + orgUnitUid + ".json?fields=id,name,code,level&paging=false").then(function (response) {

                def.resolve(response.data);
            });
            return def.promise;
        },
		
        getLoginLevel: function () {
                var def = $q.defer();
                $http.get('../api/me.json?fields=organisationUnits[id,name,level]&paging=false').then(function (response) {

                    def.resolve(response.data);
                });
                return def.promise;
            },

            getParentId: function (orgUnitUid) {
                var def = $q.defer();
                $http.get('../api/organisationUnits/' + orgUnitUid + '.json?fields=parent[id,name,level]').then(function (response) {

                    def.resolve(response.data);
                });
                return def.promise;
            },

            getChildren: function (orgUnitUid) {
                var def = $q.defer();
                $http.get('../api/organisationUnits/' + orgUnitUid + '.json?fields=children[id,name,level]').then(function (response) {

                    def.resolve(response.data);
                });
                return def.promise;
            },
            getUsersId: function (orgUnitUid) {
                var def = $q.defer();
                $http.get('../api/organisationUnits/' + orgUnitUid + '.json?fields=users[phoneNumber]').then(function (response) {

                    def.resolve(response.data);
                });
                return def.promise;
            },

            //aes code
            sendMessages: function (msg,phones) {
                var def = $q.defer();
                $http.get('http://bulksms.mysmsmantra.com:8080/WebSMS/SMSAPI.jsp?username=hispindia&password=hisp1234&sendername=HSSPIN&mobileno='+phones+'&message='+msg).then(function (response) {

                    def.resolve(response.data);
                });
                return def.promise;
            },
            getPhysiciansNum: function (tei) {
                var def = $q.defer();
                $http.get('../api/trackedEntityInstances/'+tei+'.json').then(function (response) {

                    def.resolve(response.data);
                });
                return def.promise;
            },
            // aes code
            getDataValues: function (eventc, tei) {
                var def = $q.defer();
                $http.get('../api/events/'+eventc+'.json?trackedEntityInstance='+tei).then(function (response) {

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
                        def.resolve(data);
                    }
                });
                return def;
            },
            getfinalCustomIdval:function()
            {
                for(var j=0;j<AllTieValue.length;j++)
                {
                    if(finalCustomId === AllTieValue[j])
                    {
                        // deferred.resolve(finalCustomId);
                        return true
                    }

                }
            },
            getUniqueCustomId_temp:function(finalCustomId,attributeValues, prefix){

                var def = $.Deferred();
                var thiz=this;
                for(var j=0;j<attributeValues.length;j++)
                {
                    if(finalCustomId === attributeValues[j])
                    {
                        var str = finalCustomId.split('-');
                        var incrementedId = parseInt(str[2])+1;
                        finalCustomId = str[0]+"-"+str[1]+"-"+ prefix + incrementedId;
                        thiz.getUniqueCustomId( finalCustomId, attributeValues,  prefix)
                    }
                }
                def.resolve(finalCustomId);
                return def
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
                    var str = finalCustomId.split('-');
                    var incrementedId = parseInt(str[2])+1;
                    var tempFinalCustomId = str[0]+"-"+str[1]+"-"+ prefix + incrementedId;
                    return tempThis.getUniqueCustomId( tempFinalCustomId, attributeValues, prefix );
                }
            },

            getTeiCountByOrgUnitAndProgramThroughSQLView : function( sqlViewUID, orgUnitUid, programUID ){
                var def = $.Deferred();
                var param = "var=orgUnitUid:" + orgUnitUid + "&var=programUid:" + programUID;
                $.ajax({
                    type: "GET",
                    dataType: "json",
                    async:false,
                    contentType: "application/json",
                    url: '../api/sqlViews/'+sqlViewUID+"/data?"+param+"&paging=false",
                    success: function (data) {
                        def.resolve(data);
                    }
                });
                return def;
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


