/**
 * Created by hisp on 8/12/15.
 */
 angular.module('trackerCaptureServices')


    .service('AjaxCalls', function($http) {
        return{

            getTEIbyId : function(id){
                var promise = $http.get(  '../api/trackedEntityInstances/'+id).then(function(response){

                    return response.data;
                });
                return promise;
            },
            getEventbyId : function(id){
                var promise = $http.get(  '../api/events/'+id).then(function(response){

                    return response.data;
                });
                return promise;
            },
            getNoProgramAttributes : function(){
                var promise = $http.get(  '../api/trackedEntityAttributes.json?paging=false&filter=displayInListNoProgram:eq:true&fields=:all').then(function(response){
                    return response.data;
                });
                return promise;
            },
            getTrackedEntities : function(){
                var promise = $http.get(  '../api/trackedEntities.json?paging=false').then(function(response){
                    return response.data;
                });
                return promise;
            },

            //http://127.0.0.1:8090/dhis/api/trackedEntityInstances.json?program=y6lXVg8TdOj&ou=sGXSQmbYeMk
            //http://127.0.0.1:8090/dhis/api/events/IVUDkb8kK6n.json?fields=eventMembers&paging=false

            //../api/trackedEntityInstances.json?program=y6lXVg8TdOj&ou=sGXSQmbYeMk&paging=false

            getTrackedEntityInstancesByOrgUnitAndProgram : function(){
                var promise = $http.get(  '../api/events/IVUDkb8kK6n.json?fields=eventMembers&paging=false').then(function(response){
                    return response.data;
                });
                return promise;
            },

            /*
            getTrackedEntityInstancesByOrgUnitAndProgram : function(){
                var promise = $http.get(  '../api/events/IVUDkb8kK6n.json?fields=eventMembers&paging=false').then(function(response){
                    return response.data;
                });
                return promise;
            },
            */
            //http://127.0.0.1:8090/dhis/api/events.json?programStage=s9b0ZMF7QZU&trackedEntityInstance=JND71K1mcXt&paging=false
            getEventsByTrackedEntityInstancesAndProgramStage  : function( inviteTEI ){
                var promise = $http.get(  '../api/events.json?programStage=s9b0ZMF7QZU&trackedEntityInstance=' + inviteTEI + '&paging=false').then(function(response){
                    return response.data;
                });
                return promise;
            },


            getEventsByTrackedEntityInstancesAndProgramStageUid  : function( programStageUid, inviteTEI ){
                var promise = $http.get(  '../api/events.json?programStage=' + programStageUid + '&trackedEntityInstance=' + inviteTEI + '&paging=false').then(function(response){
                    return response.data;
                });
                return promise;
            },


            //http://127.0.0.1:8090/dhis/api/events/IVUDkb8kK6n.json?paging=false
            getEventMemberByEvent  : function( eventUid ){
                var promise = $http.get(  '../api/events/'+eventUid + '.json?paging=false').then(function(response){
                    return response.data;
                });
                return promise;
            },

            getRootOrgUnit : function(){
                var promise = $http.get(  '../api/organisationUnits?filter=level:eq:1').then(function(response){
                    return response.data;
                });
                return promise;
            },

            getInvitationAndAttendedWidgetAttributes : function(){
                var promise = $http.get(  '../api/trackedEntityAttributes?fields=*,attributeValues[*,attribute[id,name,code]]&paging=false').then(function(response){
                    var associationWidgets = [];

                    if (!response.data.trackedEntityAttributes)
                        return associationWidgets;

                    for (var i=0;i<response.data.trackedEntityAttributes.length;i++){
                        if (response.data.trackedEntityAttributes[i].attributeValues)
                            for (var j=0;j<response.data.trackedEntityAttributes[i].attributeValues.length;j++){
                                if (response.data.trackedEntityAttributes[i].attributeValues[j].attribute.code=="ToBeShownInInvitationAndAttendendWidget"){
                                    if (response.data.trackedEntityAttributes[i].attributeValues[j].value){
                                        associationWidgets.push(response.data.trackedEntityAttributes[i]);
                                    }
                                }
                            }
                    }
                    return associationWidgets;
                });
                return promise;
            },


            getAssociationWidgetAttributes : function(){
                var promise = $http.get(  '../api/trackedEntityAttributes?fields=*,attributeValues[*,attribute[id,name,code]]&paging=false').then(function(response){
                    var associationWidgets = [];

                    if (!response.data.trackedEntityAttributes)
                        return associationWidgets;

                    for (var i=0;i<response.data.trackedEntityAttributes.length;i++){
                        if (response.data.trackedEntityAttributes[i].attributeValues)
                            for (var j=0;j<response.data.trackedEntityAttributes[i].attributeValues.length;j++){
                                if (response.data.trackedEntityAttributes[i].attributeValues[j].attribute.code=="ToBeShownInAssociationWidget"){
                                    if (response.data.trackedEntityAttributes[i].attributeValues[j].value){
                                        associationWidgets.push(response.data.trackedEntityAttributes[i]);
                                    }
                                }
                            }
                    }
                    return associationWidgets;
                });
                return promise;
            },

            // Get all Events for TEI UID
            getAllEventsByTEI: function (teiId) {
                var promise = $http.get('../api/events?trackedEntityInstance=' + teiId).then(function (response) {
                    return response.data;
                });
                return promise;
            }

        }

    })

    .service('utilityService', function( AjaxCalls ) {
        return {
            prepareIdToObjectMap: function (object, id) {
                var map = [];
                for (var i = 0; i < object.length; i++) {
                    map[object[i][id]] = object[i];
                }
                return map;
            },

            getAlreadyAttendedTEIMap: function (programStageUid, inviteTEI) {

                var alreadyAttendedTEIMap = [];
                var def = $.Deferred();

                AjaxCalls.getEventsByTrackedEntityInstancesAndProgramStageUid(programStageUid, inviteTEI).then(function (attendEvents) {

                    if( attendEvents.events[0].event )
                    {
                        var attendEvent = attendEvents.events[0].event;

                        AjaxCalls.getEventMemberByEvent( attendEvent ).then(function( alreadyAttendedTEIs ){

                            var attendTrackedEntityInstanceList = alreadyAttendedTEIs;

                            AjaxCalls.getEventsByTrackedEntityInstancesAndProgramStage( inviteTEI ).then(function(inviteEventMember){

                                var inviteEventUid = inviteEventMember.events[0].event;

                                AjaxCalls.getEventMemberByEvent( inviteEventUid ).then(function(invitedTrackedEntityInstances){

                                    var invitedTrackedEntityInstanceList = invitedTrackedEntityInstances;

                                    if( invitedTrackedEntityInstanceList.eventMembers )
                                    {
                                        if( attendTrackedEntityInstanceList.eventMembers )
                                        {
                                            for (var i=0;i<invitedTrackedEntityInstanceList.eventMembers.length;i++)
                                            {
                                                for (var j=0;j<attendTrackedEntityInstanceList.eventMembers.length;j++)
                                                {
                                                    if( invitedTrackedEntityInstanceList.eventMembers[i].trackedEntityInstance == attendTrackedEntityInstanceList.eventMembers[j].trackedEntityInstance)
                                                    {
                                                        alreadyAttendedTEIMap[ attendTrackedEntityInstanceList.eventMembers[j].trackedEntityInstance] = true;

                                                        //console.log(  " alreadyAttended -- " +  $scope.attendTrackedEntityInstanceList.eventMembers[j].trackedEntityInstance );
                                                        break;
                                                    }
                                                    else
                                                    {
                                                        alreadyAttendedTEIMap[ invitedTrackedEntityInstanceList.eventMembers[i].trackedEntityInstance] = false;
                                                        //console.log(  " invited -- " +  $scope.invitedTrackedEntityInstanceList.eventMembers[i].trackedEntityInstance );
                                                    }
                                                }
                                            }
                                        }

                                        def.resolve( alreadyAttendedTEIMap );
                                    }

                                });

                            });
                        });
                    }

                });

                return def;
                //return alreadyAttendedTEIMap;
            }
        }
    })



    .service('AssociationService', function (AjaxCalls,DHIS2EventFactory,$timeout,$rootScope) {
        return {
            extractAllEventMembers: function (events) {
                var eventMembers = [];
                var eventMembersMap = [];
                for (var i = 0; i < events.length; i++) {
                    if (events[i].eventMembers) {
                        for (var j = 0; j < events[i].eventMembers.length; j++) {
                            if (!eventMembersMap[events[i].eventMembers[j].trackedEntityInstance]) {
                                eventMembers.push(events[i].eventMembers[j]);
                                eventMembersMap[events[i].eventMembers[j].trackedEntityInstance] = events[i].eventMembers[j];
                            }
                        }
                    }
                }
                return eventMembers;
            },
            addEventMembersToEventAndUpdate: function (event) {
                var thiz = this;
                // this will add association to event
                // get all events of this TEI and extract all event members to add to this event
                AjaxCalls.getAllEventsByTEI(event.trackedEntityInstance).then(function (data) {

                    var allEventMembers = thiz.extractAllEventMembers(data.events);
                    if (allEventMembers.length > 0) {
                        event.eventMembers = allEventMembers;
                    }
                    DHIS2EventFactory.update(event).then(function(response){
                        if (response.httpStatus == "OK"){
                            console.log("EventMembers added successfully");
                            $timeout(function () {
                                $rootScope.$broadcast('association-widget', {event : event , show :true});
                            });
                        }else{
                            console.log("An unexpected thing occurred.");
                        }
                    })
                })

            },
            addEventMemberIfExist : function(eventTo,eventFrom){
                if (eventFrom.eventMembers)
                    eventTo.eventMembers = eventFrom.eventMembers;
                return eventTo;
            }
        }
    });