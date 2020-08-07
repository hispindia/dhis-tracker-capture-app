var trackerCaptureamesNimhans = angular.module('trackerCapture');
	trackerCaptureamesNimhans.controller('duepersonController',  function ($rootScope, $scope, $timeout, $location) {
	
		$.ajaxSetup({
			async: false
		});
		$scope.detail_house_member = [];
		$scope.detail_house_member_anc = [];
		$scope.detail_house_member_pnc = [];
		$scope.detail_house_member_npcdcs = [];
		$scope.detail_house_member_child = [];
		$scope.countval = 0;
		$scope.programvalue = "";
		$scope.programvaluearray = [];
		$scope.objtrack_anc_due = [];
		$scope.objtrack_pnc_due = [];
		$scope.anc_last_visit_date = [];
		$scope.objtrack_npcdcs = [];
		$scope.objtrack_child = [];
		$scope.pnc_last_visit_date = [];
		$scope.npcdcs_last_visit_date = [];
		$scope.duedate_child = [];
		$scope.duedate_anc = [];
		$scope.duedate_npcdcs = [];
		$scope.duedate_pnc = [];
		$scope.loadQueue2 = function () {
			//$('#loader').show();
			var e = document.getElementById('loader');
			if (e.style.display == 'none') e.style.display = 'block';
			$scope.objtrack_pnc_due = [];
			$scope.duedate_child = [];
			$scope.npcdcs_last_visit_date = [];
			$scope.objtrack1 = [];
			$scope.pnc_last_visit_date = [];
			$scope.anc_last_visit_date = [];
			$scope.objtrack_npcdcs = [];
			$scope.objtrack_child = [];
			$scope.anc_date_obj = [];
			$scope.pnc_date_obj = [];
			$scope.npcdcs_date_obj = [];
			$scope.duedate_npcdcs = [];
			$scope.objtrack_anc_due = [];
			$scope.duedate_anc = [];
			$scope.duedate_pnc = [];
			var housevalue = document.getElementById('searchvalue').value;
			var use_filer_household = housevalue.substring(0, 4);
			$.get("../api/trackedEntityInstances.json?ou=lZtSBQjZCaX&program=TcaMMqHJxK5&filter=YFjB0zhySP6:EQ:" + use_filer_household + "&skipPaging=true", function (data1) {
	
				$scope.trackkdata = data1;
	
				for (var i = 0; i < $scope.trackkdata.trackedEntityInstances.length; i++) {
	
					var attributepath = $scope.trackkdata.trackedEntityInstances[i].attributes;
					for (var q = 0; q < attributepath.length; q++) {
	
						if (attributepath[q].attribute == "Dnm1mq6iq2d") {
							var aa = attributepath[q].value;
							var res = aa.split("/");
							res = res[1];
							if (housevalue == res) {
	
								var track1 = $scope.trackkdata.trackedEntityInstances[i].trackedEntityInstance;
	
								$scope.objtrack1.push(track1);
							}
						}
					}
				}
	
				$scope.detail_house_member = [];
				$scope.programvaluearray = [];
				$scope.detail_house_member_anc = [];
				$scope.detail_house_member_pnc = [];
				$scope.detail_house_member_npcdcs = [];
				$scope.detail_house_member_child = [];
			});
	
			if ($scope.objtrack1.length == 0) {
				var resultval = "<tr   style='border:1px solid black;background-color:white;'>	<td colspan='4'> NO RECORD FOUND....</td></tr>";
				$(".housedata").append(resultval);
			}
	
			//Get the programs attached to TEI
			for (var i = 0; i < $scope.objtrack1.length; i++) {
				$.get("../api/trackedEntityInstances/" + $scope.objtrack1[i] + ".json?fields=enrollments[program]", function (programdata) {
	
					var prodata = programdata;
					for (var j = 0; j < prodata.enrollments.length; j++) {
						var programid = prodata.enrollments[j].program;
						if (programid == "TcaMMqHJxK5") $scope.programvalue = $scope.programvalue + "," + "Household Member";else if (programid == "nBh6jxTPf0P") $scope.programvalue = $scope.programvalue + "," + "Eligible Couple";else if (programid == "SUCUF657zNe") $scope.programvalue = $scope.programvalue + "," + "Maternal Health";else if (programid == "JdZ3gv6cx54") $scope.programvalue = $scope.programvalue + "," + "Child Health";else if (programid == "jC8Gprj4pWV") $scope.programvalue = $scope.programvalue + "," + "NPCDCS";else if (programid == "qAeWjN7Iqi7") $scope.programvalue = $scope.programvalue + "," + "TB";
					}
				});
				$scope.programvaluearray.push($scope.programvalue);
				$scope.programvalue = "";
			}
	
			for (var x = 0; x < $scope.objtrack1.length; x++) {
				var url1 = "../api/trackedEntityInstances/" + $scope.objtrack1[x] + ".json?";
				$.get(url1, function (data1) {
	
					var trackdata = data1;
	
					for (var q = 0; q < trackdata.attributes.length; q++) {
						var idd = trackdata.attributes[q].attribute;
	
						if (trackdata.attributes[q].attribute == "xalnzkNfD77") //name of family member
							{
	
								var namemember = trackdata.attributes[q].value;
							} else if (trackdata.attributes[q].attribute == "Dnm1mq6iq2d") //family unique id
							{
	
								var familyid = trackdata.attributes[q].value;
							} else if (trackdata.attributes[q].attribute == "YFjB0zhySP6") //household
							{
	
								var house = trackdata.attributes[q].value;
							}
					}
	
					$scope.memberdetail = {
						"house": house,
						"namemember": namemember,
						"familyid": familyid,
						"programvalue": $scope.programvaluearray[x]
	
					};
					$scope.detail_house_member.push($scope.memberdetail);
				});
			}
	
			///  CHECK FOR PNC AND ANC VISITS....
			for (var j = 0; j < $scope.objtrack1.length; j++) {
				// count++;
				$.get("../api/events.json?orgUnit=lZtSBQjZCaX&program=SUCUF657zNe&trackedEntityInstance=" + $scope.objtrack1[j] + "&order=dueDate:asc", function (data) {
	
					var trackdata = data;
					console.log(trackdata);
	
					for (var i = 0; i < trackdata.events.length; i++) {
						var matchevent = trackdata.events[i].programStage;
	
						if (matchevent == "WMnWjG8PS58" && trackdata.events[i].enrollmentStatus == "ACTIVE") {
							// ANC SECOND VISIT
	
							if (trackdata.events[i].status == "SCHEDULE") {
								var duedate = trackdata.events[i].dueDate.substring(0, 10);
								//var repodate= new Date (duedate),dateantime=new Date();
								//var datediff=(repodate<dateantime);
	
								//if(datediff==true){    
								var track = trackdata.events[i].trackedEntityInstance;
								$scope.duedate_anc.push(duedate);
								$scope.objtrack_anc_due.push(track);
								// }
							}
						} else if (matchevent == "DEwcVnLljOB" && trackdata.events[i].enrollmentStatus == "ACTIVE") {
							// PNC VISIT
	
							if (trackdata.events[i].status == "SCHEDULE") {
								var duedate = trackdata.events[i].dueDate.substring(0, 10);
								//var repodate= new Date (duedate),dateantime=new Date();
								//var datediff=(repodate<dateantime);
	
								//if(datediff==true){    
								var track = trackdata.events[i].trackedEntityInstance;
								$scope.duedate_pnc.push(duedate);
								$scope.objtrack_pnc_due.push(track);
								//}
							}
						}
					}
				});
			}
	
			for (var j = 0; j < $scope.objtrack1.length; j++) {
				// count++;
				$.get("../api/events.json?orgUnit=lZtSBQjZCaX&program=jC8Gprj4pWV&trackedEntityInstance=" + $scope.objtrack1[j] + "&order=dueDate:asc", function (data) {
	
					var trackdata = data;
					console.log(trackdata);
	
					for (var i = 0; i < trackdata.events.length; i++) {
						var matchevent = trackdata.events[i].programStage;
	
						if (matchevent == "mq26ujXKHI5" && trackdata.events[i].enrollmentStatus == "ACTIVE") {
							// npcdcs visit
	
							if (trackdata.events[i].status == "SCHEDULE") {
								var duedate = trackdata.events[i].dueDate.substring(0, 10);
								// var repodate= new Date (duedate),dateantime=new Date();
								//var datediff=(repodate<dateantime);
	
								//if(datediff==true){    
								var track = trackdata.events[i].trackedEntityInstance;
								$scope.duedate_npcdcs.push(duedate);
								$scope.objtrack_npcdcs.push(track);
								// }
							}
						}
					}
				});
			}
	
			for (var j = 0; j < $scope.objtrack1.length; j++) {
				// count++;
				$.get("../api/events.json?orgUnit=lZtSBQjZCaX&program=JdZ3gv6cx54&trackedEntityInstance=" + $scope.objtrack1[j] + "&order=dueDate:asc", function (data) {
	
					var trackdata = data;
					console.log(trackdata);
	
					for (var i = 0; i < trackdata.events.length; i++) {
						var matchevent = trackdata.events[i].programStage;
	
						if (matchevent == "Z0NnCljuPxL" && trackdata.events[i].enrollmentStatus == "ACTIVE") {
							// ANC SECOND VISIT
	
							if (trackdata.events[i].status == "SCHEDULE") {
								// var duedate=trackdata.events[i].dueDate.substring(0, 10);
								// var repodate= new Date (duedate),dateantime=new Date();
								var datediff = repodate < dateantime;
	
								//if(datediff==true){    
								var track = trackdata.events[i].trackedEntityInstance;
								$scope.duedate_child.push(duedate);
								$scope.objtrack_child.push(track);
								//}
							}
						}
					}
				});
			}
			// calculating last visit value for anc the due personal 
			for (var j = 0; j < $scope.objtrack_anc_due.length; j++) {
				$.get("../api/events.json?orgUnit=lZtSBQjZCaX&program=SUCUF657zNe&trackedEntityInstance=" + $scope.objtrack_anc_due[j] + "&order=eventDate:asc&skipPaging=true", function (data) {
	
					var trackdata = data;
	
					for (var i = 0; i < trackdata.events.length; i++) {
						var matchevent = trackdata.events[i].programStage;
	
						if (matchevent == "WMnWjG8PS58") //Anc second visit
							{
	
								if (trackdata.events[i].eventDate) $scope.anc_date_obj.push(trackdata.events[i].eventDate.substring(0, 10));
							}
					}
				});
				if ($scope.anc_date_obj.length == 0) {
					$scope.anc_last_visit_date.push("No last visit");
				} else $scope.anc_last_visit_date.push($scope.anc_date_obj[$scope.anc_date_obj.length - 1]);
	
				$scope.anc_date_obj = [];
			}
			//Calculating last value for PNC last visited value ..
			for (var j = 0; j < $scope.objtrack_pnc_due.length; j++) {
				$.get("../api/events.json?orgUnit=lZtSBQjZCaX&program=SUCUF657zNe&trackedEntityInstance=" + $scope.objtrack_pnc_due[j] + "&order=eventDate:asc&skipPaging=true", function (data) {
	
					var trackdata = data;
	
					for (var i = 0; i < trackdata.events.length; i++) {
						var matchevent = trackdata.events[i].programStage;
	
						if (matchevent == "DEwcVnLljOB") //Pnc visit
							{
	
								if (trackdata.events[i].eventDate) $scope.pnc_date_obj.push(trackdata.events[i].eventDate.substring(0, 10));
							}
					}
				});
				if ($scope.pnc_date_obj.length == 0) {
					$scope.pnc_last_visit_date.push("No last visit");
				} else $scope.pnc_last_visit_date.push($scope.pnc_date_obj[$scope.pnc_date_obj.length - 1]);
	
				$scope.pnc_date_obj = [];
			}
			//Calculating last value for npcdcs last visited value ..
			for (var j = 0; j < $scope.objtrack_npcdcs.length; j++) {
				$.get("../api/events.json?orgUnit=lZtSBQjZCaX&program=jC8Gprj4pWV&trackedEntityInstance=" + $scope.objtrack_npcdcs[j] + "&order=eventDate:asc&skipPaging=true", function (data) {
	
					var trackdata = data;
	
					for (var i = 0; i < trackdata.events.length; i++) {
						var matchevent = trackdata.events[i].programStage;
	
						if (matchevent == "mq26ujXKHI5") //Pnc visit
							{
	
								if (trackdata.events[i].eventDate) $scope.npcdcs_date_obj.push(trackdata.events[i].eventDate.substring(0, 10));
							}
					}
				});
				if ($scope.npcdcs_date_obj.length == 0) {
					$scope.npcdcs_last_visit_date.push("No last visit");
				} else $scope.npcdcs_last_visit_date.push($scope.npcdcs_date_obj[$scope.npcdcs_date_obj.length - 1]);
	
				$scope.npcdcs_date_obj = [];
			}
	
			if ($scope.objtrack_anc_due.length > 0) $scope.loadattributevalue_anc($scope.objtrack_anc_due);else {
				var result = "<tr   style='border:1px solid black;background-color:white;'>	<td colspan='3'> NO RECORD FOUND....</td></tr>";
				$(".ancdata").append(result);
			}
			if ($scope.objtrack_pnc_due.length > 0) $scope.loadattributevalue_pnc($scope.objtrack_pnc_due);else {
				var result = "<tr   style='border:1px solid black;background-color:white;'>	<td colspan='3'> NO RECORD FOUND....</td></tr>";
				$(".pncdata").append(result);
			}
			if ($scope.objtrack_npcdcs.length > 0) $scope.loadattributevalue_npcdcs($scope.objtrack_npcdcs);else {
				var result = "<tr   style='border:1px solid black;background-color:white;'>	<td colspan='3'> NO RECORD FOUND....</td></tr>";
				$(".npcdcsdata").append(result);
			}
			if ($scope.objtrack_child.length > 0) $scope.loadattributevalue_child($scope.objtrack_child);else {
				var result = "<tr   style='border:1px solid black;background-color:white;'>	<td colspan='3'> NO RECORD FOUND....</td></tr>";
				$(".childdata").append(result);
			}
	
			$scope.stoploader();
		};
	
		// GET THE TEI ATTRIBUTES VALUE 
		$scope.loadattributevalue_anc = function (track) {
			$scope.objtrack = track;
			$scope.detail_house_member_anc = [];
			$scope.countval = 0;
			for (var g = 0; g < $scope.objtrack.length; g++) {
				$scope.countval++;
	
				$.get("../api/trackedEntityInstances/" + $scope.objtrack[g] + ".json?&skipPaging=true", function (data1) {
					var trackdata = data1;
	
					for (var i = 0; i < trackdata.attributes.length; i++) {
						var attributepath = trackdata.attributes[i].attribute;
	
						// $scope.objattribute.push(attributepath);
	
						if (attributepath == "YFjB0zhySP6") //house number
							{
								var aa = trackdata.attributes[i].value;
	
								//housenumber=aa;
								var house = aa;
							} else if (attributepath == "xalnzkNfD77") //Name of woman
							{
								var aa = trackdata.attributes[i].value;
	
								//nameofwoman=aa;
								var namemember = aa;
							} else if (attributepath == "iIf1gJ4FVdR") //age  
							{
								var aa = trackdata.attributes[i].value;
	
								var agevalue = aa;
							}
					}
	
					$scope.memberdetail_anc = {
						"house": house,
						"namemember": namemember,
						"lastdate": $scope.anc_last_visit_date[g],
						"duedate": $scope.duedate_anc[g]
	
					};
					$scope.detail_house_member_anc.push($scope.memberdetail_anc);
				});
			}
	
			console.log($scope.detail_house_member);
		};
	
		// GET THE TEI ATTRIBUTES VALUE 
		$scope.loadattributevalue_pnc = function (track) {
			$scope.objtrack = track;
			$scope.detail_house_member_pnc = [];
			$scope.countval = 0;
			for (var g = 0; g < $scope.objtrack.length; g++) {
				$scope.countval++;
	
				$.get("../api/trackedEntityInstances/" + $scope.objtrack[g] + ".json?&skipPaging=true", function (data1) {
					var trackdata = data1;
	
					for (var i = 0; i < trackdata.attributes.length; i++) {
						var attributepath = trackdata.attributes[i].attribute;
	
						// $scope.objattribute.push(attributepath);
	
						if (attributepath == "YFjB0zhySP6") //house number
							{
								var aa = trackdata.attributes[i].value;
	
								//housenumber=aa;
								var house = aa;
							} else if (attributepath == "xalnzkNfD77") //Name of woman
							{
								var aa = trackdata.attributes[i].value;
	
								//nameofwoman=aa;
								var namemember = aa;
							} else if (attributepath == "iIf1gJ4FVdR") //age  
							{
								var aa = trackdata.attributes[i].value;
	
								var agevalue = aa;
							}
					}
	
					$scope.memberdetail_pnc = {
						"house": house,
						"namemember": namemember,
						"lastdate": $scope.pnc_last_visit_date[g],
						"duedate": $scope.duedate_pnc[g]
	
					};
					$scope.detail_house_member_pnc.push($scope.memberdetail_pnc);
				});
			}
	
			console.log($scope.detail_house_member);
		};
		$scope.loadattributevalue_npcdcs = function (track) {
			$scope.objtrack = track;
			$scope.detail_house_member_npcdcs = [];
			$scope.countval = 0;
			for (var g = 0; g < $scope.objtrack.length; g++) {
				$scope.countval++;
	
				$.get("../api/trackedEntityInstances/" + $scope.objtrack[g] + ".json?&skipPaging=true", function (data1) {
					var trackdata = data1;
	
					for (var i = 0; i < trackdata.attributes.length; i++) {
						var attributepath = trackdata.attributes[i].attribute;
	
						// $scope.objattribute.push(attributepath);
	
						if (attributepath == "YFjB0zhySP6") //house number
							{
								var aa = trackdata.attributes[i].value;
	
								//housenumber=aa;
								var house = aa;
							} else if (attributepath == "xalnzkNfD77") //Name of woman
							{
								var aa = trackdata.attributes[i].value;
	
								//nameofwoman=aa;
								var namemember = aa;
							} else if (attributepath == "iIf1gJ4FVdR") //age  
							{
								var aa = trackdata.attributes[i].value;
	
								var agevalue = aa;
							}
					}
	
					$scope.memberdetail_npcdcs = {
						"house": house,
						"namemember": namemember,
						"lastdate": $scope.npcdcs_last_visit_date[g],
						"duedate": $scope.duedate_npcdcs[g]
	
					};
					$scope.detail_house_member_npcdcs.push($scope.memberdetail_npcdcs);
				});
			}
	
			console.log($scope.detail_house_member);
		};
		$scope.loadattributevalue_child = function (track) {
			$scope.objtrack = track;
			$scope.detail_house_member_child = [];
			$scope.countval = 0;
			for (var g = 0; g < $scope.objtrack.length; g++) {
				$scope.countval++;
	
				$.get("../api/trackedEntityInstances/" + $scope.objtrack[g] + ".json?&skipPaging=true", function (data1) {
					var trackdata = data1;
	
					for (var i = 0; i < trackdata.attributes.length; i++) {
						var attributepath = trackdata.attributes[i].attribute;
	
						// $scope.objattribute.push(attributepath);
	
						if (attributepath == "YFjB0zhySP6") //house number
							{
								var aa = trackdata.attributes[i].value;
	
								//housenumber=aa;
								var house = aa;
							} else if (attributepath == "xalnzkNfD77") //Name of woman
							{
								var aa = trackdata.attributes[i].value;
	
								//nameofwoman=aa;
								var namemember = aa;
							} else if (attributepath == "iIf1gJ4FVdR") //age  
							{
								var aa = trackdata.attributes[i].value;
	
								var agevalue = aa;
							}
					}
	
					$scope.memberdetail_child = {
						"house": house,
						"namemember": namemember,
						"lastdate": $scope.duedate_child[g],
						"duedate": $scope.duedate_child[g]
	
					};
					$scope.detail_house_member_child.push($scope.memberdetail_child);
				});
			}
		};
		$scope.stoploader = function () {
	
			console.log($scope.detail_house_member);
			var e = document.getElementById('loader');
			if (e.style.display == 'block') e.style.display = 'none';
		};
	});