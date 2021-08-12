/* global trackerCapture, angular */

var trackerCapture = angular.module('trackerCapture');
trackerCapture.controller('IncomingController', ["$rootScope", "$scope", "$timeout", "$location", "SessionStorageService", "CurrentSelection", "CustomIdService", function ($rootScope, $scope, $timeout, $location, SessionStorageService, CurrentSelection, CustomIdService) {


	var ouid = SessionStorageService.get('ouSelected');
	var selections = CurrentSelection.get();
	selection.load();

	// Listen for OU changes
	selection.setListenerFunction(function () {
		$scope.selectedOrgUnitUid = selection.getSelected();
		$scope.loadQueue();
	}, false);

	debugger;
	$scope.goToDashboard = function (t) {
		t.clicked = true;
		var base = location.protocol + '//' + location.host + "/dhis"; //+window.location.pathname;
		$location.path('/dashboard').search({
			tei: t.tei,
			program: "L78QzNqadTV",
			//  ou: "CPtzIhyn36z",
			ou: ouid,
			queue: true,
			from: 'receivedReferral'
		});
		// $window.open(base+'/dhis-web-tracker-capture/index.html#/dashboard?tei='+ev.tei+'&program=a9cQSlDVI2n&ou=CPtzIhyn36z'+$scope.ouId, '_blank');
	};
	$scope.getcasecat = function (c) {
		var cc = "";
		if (c == "new") { cc = "New"; }
		else if (c == "old") { cc = "Old"; }
		else {
			cc = "";
		}
		return cc;
	};

	$scope.getps  = function(psid){
		var ps = "";
		if(psid == "fn0d1BDlRIQ"){ps = "Signs, Symptoms and Classification"}
		else if(psid == "gAkjKEitHrU"){ps = "Sensory assessment"}
		else if(psid == "ikKphqSsU6b"){ps = "Lepra and Neuritis"}
		else if(psid == "YrjjV4LVXo6"){ps = "Contact tracing"}
		else if(psid == "WeJyo44zauD"){ps = "Treatment"}
		else if(psid == "UvmXo83udun"){ps = "Exit and IEC"}
		else{
			ps = ""
		}
		return ps;
	};
	var ounamee = "";
	$scope.getOuName = function (ou) {
		$.ajax({
			async: false,
			type: "GET",
			url: '../api/organisationUnits/' + ou + '.json',
			success: function (data) {
				ounamee = data.displayName;
			}
		});
		return ounamee;
	};


	var getAllEvents = function (tei) {
		var data5 = "";
		$.ajax({
			async: false,
			type: "GET",
			url: "../api/events.json?program=vopM2i6vTGC&trackedEntityInstance=" + tei + "&order=eventDate:ASC&skipPaging=false",
			success: function (data) {
				data5 = data;
			}
		});
		return data5;
	};



	var getTeiData = function (tei) {
		var teidata = "";
		$.ajax({
			async: false,
			type: "GET",
			url: '../api/trackedEntityInstances/' + tei + '.json',
			success: function (data) {
				teidata = data;
			}
		});

		return teidata;
	};

	var teiMap = function (data) {
		var mappedteis = [];
		var k = 0;
		for (var i = 0; i < data.events.length; i++) {
			if (mappedteis.indexOf(data.events[i].trackedEntityInstance) == -1) {
				mappedteis[k] = data.events[i].trackedEntityInstance;
				k++;
			}
		}
		return mappedteis;

	};


	$scope.loadQueue = function () {
		var filtered_data = [];
		var pdata = "";
		var flag;
			CustomIdService.getOrgunitLevel($scope.selectedOrgUnitUid).then(function (oudata) {
		
			//checking ou level
			if (oudata.level == 4) {
			//getting all events on selected ou
				CustomIdService.getAllEvents($scope.selectedOrgUnitUid).then(function (eventsdata) {
					//getting unique teis from all events occuring on selected ou
					var allTeis = teiMap(eventsdata);
					
					for (var j = 0, len = allTeis.length; j < len; j++) {	
						var tei = allTeis[j];

						//getting all events on one tei
						var teieventsd = getAllEvents(tei);
						var teievents = teieventsd.events;
						for (var y = 0, lenn = teievents.length - 1; y < lenn; y++) {

							//checking ou of two consecutive events and checking for refferals
							if (teievents[y].orgUnit != $scope.selectedOrgUnitUid && teievents[y + 1].orgUnit == $scope.selectedOrgUnitUid && teievents[y + 1].status != "COMPLETED") {
								
								//getting data of particular tei
								var returnedDdata = getTeiData(tei);
								var ps = teievents[y + 1].programStage;
								var psd = $scope.getps(ps);

								
								//pushing all data to tei object
								if (psd != "") {
									var teidata = returnedDdata;
									teidata.tei = returnedDdata.trackedEntityInstance;
									teidata.psd = psd;

									//getting all values of tei attributes
									for (var j = 0; j < returnedDdata.attributes.length; j++) {
										if (returnedDdata.attributes[j].displayName == "First name") {
											teidata.firstname = returnedDdata.attributes[j].value;
										}
										if (returnedDdata.attributes[j].displayName == "Last name") {
											teidata.lastname = returnedDdata.attributes[j].value;
										}
										if (returnedDdata.attributes[j].displayName == "Age") {
											teidata.age = returnedDdata.attributes[j].value;
										}
										if (returnedDdata.attributes[j].displayName == "Mobile number") {
											teidata.mobilenum = returnedDdata.attributes[j].value;
										}
										if (returnedDdata.attributes[j].displayName == "Case category") {
											var cc = $scope.getcasecat(returnedDdata.attributes[j].value);
											teidata.casecat = cc;
										}
										if (returnedDdata.attributes[j].displayName == "Sex") {
											teidata.gender = returnedDdata.attributes[j].value;
										}

									}

									// getting ou name through whichtei is reffered
									var ouname = $scope.getOuName(teievents[y].orgUnit);
									teidata.rf = ouname;
									filtered_data.push(teidata);
								}

							}
						}
					}

				});
				$timeout(function () {
					$scope.filtered_teidata = filtered_data;
					//document.getElementById('loader').style.display = "none";
				});
			}
			else { alert("Wrong Selection !"); }
		});
		
	};



	//$scope.loadQueue();


}]);