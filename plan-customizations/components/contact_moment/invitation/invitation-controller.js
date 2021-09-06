//trackerCapture.controller('InvitationController',
  var trackerCapture = angular.module('trackerCapture');
trackerCapture.controller('InvitationController',
    function ($rootScope,
              $scope,
              $modal,
              $timeout,
              AjaxCalls,
              ModalService,
			CurrentSelection,
              DHIS2EventFactory,
              utilityService) {

        $scope.teiAttributesMapInvitation = [];
        $scope.trackedEntityMap = [];
		 // ***********************for csv export******************* //
        $scope.attendancelist=[];
        $scope.selections = CurrentSelection.get();
        $scope.selectedTei = angular.copy($scope.selections.tei);
        $scope.selectedProgram = $scope.selections.pr;
        $scope.contactmomenttype=[];
        $scope.data1=[];
        $scope.filename = "test1";
        // *****************for csv export end***********************//

        $scope.$on('invitation-div', function (event, args) {

            $scope.TEtoEventTEIMap = [];
            $scope.TEWiseEventTEIs = [];

            //console.log("Current Event - " + event + " 2nd Argu "+ args );
            //console.log("Current Event 2- " + args.event.event + " 2nd Argu 2 "+ args.show );

            if (args.show)
            {
                $scope.eventSelected = true;
                AjaxCalls.getEventbyId(args.event.event).then(function(event){
                    $scope.selectedEventInvitation = event;
					$scope.TEtoEventTEIMap = [];
					$scope.TEWiseEventTEIs = [];	
                    if (event.eventMembers)
                        for (var i=0;i<event.eventMembers.length;i++){
                            if (!$scope.TEtoEventTEIMap[event.eventMembers[i].trackedEntity]){
                                $scope.TEtoEventTEIMap[event.eventMembers[i].trackedEntity] = [];
                            }
                            $scope.TEtoEventTEIMap[event.eventMembers[i].trackedEntity].push(event.eventMembers[i]);

                        }
                    for (var key in $scope.TEtoEventTEIMap){
                        var TEIList = [];
                        for (var j=0;j<$scope.TEtoEventTEIMap[key].length;j++) {
                             $scope.updateMap($scope.TEtoEventTEIMap[key][j]);
                            TEIList.push($scope.TEtoEventTEIMap[key][j])
                        }
                        $scope.TEWiseEventTEIs.push({
                            id: key,
                            trackedEntity: $scope.trackedEntityMap[key].displayName,
                            TEIList :TEIList});
                    }
                });
            }
            else
            {
                $scope.selectedEventInvitation = undefined;
            }


        });
        /*
        $scope.$on('association-widget', function (event, args) {

            $scope.TEtoEventTEIMap = [];
            $scope.TEWiseEventTEIs = [];
            if (args.show){
               $scope.eventSelected = true
                AjaxCalls.getEventbyId(args.event.event).then(function(event){
                    $scope.selectedEvent = event;

                    if (event.eventMembers)
                    for (var i=0;i<event.eventMembers.length;i++){
                        if (!$scope.TEtoEventTEIMap[event.eventMembers[i].trackedEntity]){
                            $scope.TEtoEventTEIMap[event.eventMembers[i].trackedEntity] = [];
                        }
                            $scope.TEtoEventTEIMap[event.eventMembers[i].trackedEntity].push(event.eventMembers[i]);

                    }
                    for (key in $scope.TEtoEventTEIMap){
                        var TEIList = [];
                        for (var j=0;j<$scope.TEtoEventTEIMap[key].length;j++) {
                            updateMap($scope.TEtoEventTEIMap[key][j]);
                            TEIList.push($scope.TEtoEventTEIMap[key][j])
                        }
                        $scope.TEWiseEventTEIs.push({
                            id: key,
                            trackedEntity: $scope.trackedEntityMap[key].displayName,
                            TEIList :TEIList});
                    }
                })
            }else {
                $scope.selectedEvent = undefined;
            }
        });
        */

        // get all no program attributes
        //AjaxCalls.getNoProgramAttributes().then(function(data){
        //    $scope.noProgramAttributes = data.trackedEntityAttributes;
        //})

        //get attributes for display in association widget
        AjaxCalls.getInvitationAndAttendedWidgetAttributes().then(function(invitationAttributes){
            $scope.invitationAttributes = invitationAttributes;
			
			  // *******************for csv export*********************** //
            if (angular.isUndefined($scope.selectedProgram.name))
            {
                $scope.attendancelist[5] = " ";}
            else {
                $scope.attendancelist[5] =$scope.selectedProgram.name;
            }
            if (angular.isUndefined($scope.selectedOrgUnit.name))
            {
                $scope.attendancelist[6] = " ";}
            else {
                $scope.attendancelist[6] =$scope.selectedOrgUnit.name;
            }
            if (angular.isUndefined( $scope.selectedTei.attributes[0].value)||(($scope.selectedTei.attributes[0].value).startsWith("PLAN")))
            {
                $scope.contactmomenttype[0] = " ";}
            else {
                $scope.contactmomenttype[0]=  $scope.selectedTei.attributes[0].value;
            }

            $scope.data1 = [{
                a:"Program:   "+$scope.attendancelist[5],
                b:"",
                c:"Enrolling organisation unit:"+ $scope.attendancelist[6],
                d:"",
                e:"Contact Moment Type:    "+$scope.contactmomenttype[0]}];

            $scope.data1.length=2;
            $scope.data1 = $scope.data1.concat ({
                a: invitationAttributes[0]['displayName'],
                b:invitationAttributes[1]['displayName'],
                c:invitationAttributes[2]['displayName'],
                d:invitationAttributes[3]['displayName'],
                e:invitationAttributes[4]['displayName']	});

            // *******************for csv export end*******************//
			
			
        });

        // get all tracked entities

        AjaxCalls.getTrackedEntities().then(function(data){
            if (data.trackedEntities)
            $scope.trackedEntityMap = utilityService.prepareIdToObjectMap(data.trackedEntities,"id");
        });


        $scope.showInvitationSelectionScreen = function () {

            var modalInstance = $modal.open({
                templateUrl: 'plan-customizations/components/contact_moment/invitation/addInvitation.html',
                controller: 'AddInvitationController',
                windowClass: 'modal-full-window',
                resolve: {

                }
            });
            modalInstance.selectedEventInvitation = $scope.selectedEventInvitation;
            modalInstance.result.then(function () {

            }, function () {
            });
        };

        $scope.updateMap = function(tei){
		      // *************************for csv export**************************** //
            $scope.data1.length=3;
            AjaxCalls.getInvitationAndAttendedWidgetAttributes().then(function(invitationAttributes){
                // ***********************for csv export end**********************************//

            for (var i=0;i<tei.attributes.length;i++){

                if (!$scope.teiAttributesMapInvitation[tei.trackedEntityInstance]){
                    $scope.teiAttributesMapInvitation[tei.trackedEntityInstance] = []
                }
                $scope.teiAttributesMapInvitation[tei.trackedEntityInstance][tei.attributes[i].attribute] = tei.attributes[i].value;
            }
			
			   $scope.invitationAttributes = invitationAttributes;
                // ********************************for csv export************************* //
                for(var i =0;i<5;i++) {
                   if (angular.isUndefined($scope.teiAttributesMapInvitation[tei.trackedEntityInstance][invitationAttributes[i]['id']]))
                    {
                        $scope.attendancelist[i] = " ";}
                    else {
                        $scope.attendancelist[i] = $scope.teiAttributesMapInvitation[tei.trackedEntityInstance][invitationAttributes[i]['id']];
                    }
                }
                $scope.data1 = $scope.data1.concat({
                    a:$scope.attendancelist[0],
                    b:$scope.attendancelist[1],
                    c:$scope.attendancelist[2],
                    d:$scope.attendancelist[3],
                    e:$scope.attendancelist[4]});

            });
			   
        }


        // delete Tracked Entity Instance From Event Invitation
        $scope.deleteTrackedEntityInstanceFromEventInvitation = function(trackedEntityInstance, invitationEvent){

            var modalOptions = {
                closeButtonText: 'cancel',
                actionButtonText: 'delete',
                headerText: 'delete',
                bodyText: 'are_you_sure_to_delete'
            };

            ModalService.showModal({}, modalOptions).then(function(result){
                //alert( trackedEntityInstance  + "--" + attendanceEvent.eventMembers.length );
                if (invitationEvent.eventMembers.length)
                {
                    for ( var i=0;i<invitationEvent.eventMembers.length;i++ )
                    {
                        if (invitationEvent.eventMembers[i].trackedEntityInstance == trackedEntityInstance)
                        {
                            invitationEvent.eventMembers.splice(i,1);
                        }
                    }
                }

                if (invitationEvent.eventMembers.length == 0)
                {
                    delete(invitationEvent.eventMembers);
                }

                //update events list after delete tei

                DHIS2EventFactory.update(invitationEvent).then(function(response)
                {
                    if (response.httpStatus == "OK")
                    {
                        $timeout(function () {
                            $rootScope.$broadcast('invitation-div', {event : invitationEvent, show :true});
                        }, 200);
                    }
                    else
                    {
                        alert("An unexpected thing occurred.");
                    }
                });

            });
        };

    });