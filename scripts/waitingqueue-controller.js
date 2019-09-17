var trackerCaptureamesNimhans = angular.module('trackerCapture');
trackerCaptureamesNimhans.controller('waitingqueueController',  function ($rootScope, $scope, $timeout, $location) {
    $.ajaxSetup({
        async: false
    });
    $scope.objtrack_opd = [];
    $scope.objattribute = [];
    $scope.objtrack_triage = [];
    $scope.objtrack_pharmacy = [];
    $scope.objtrack_triage_value = [];
    $scope.objtrack_lab = [];
    $scope.basichouse = ["iIf1gJ4FVdR", "YFjB0zhySP6", "xalnzkNfD77", "MV4wWoZBrJS", "yDCO4KM4WVA", "Lt9ZrfgAMuw"];
    $scope.username;
    $scope.countval = 0;
    $scope.detail_house_member = [];
    $scope.global_id_array = ["xeY2hFI7J9p", "hBAATiHH0rL", "T4eGuI8Gn5P", "kkLvVNLd0Le"];
    $scope.registeredid = [];
    $scope.goToDashboard = function (evv) {
        evv.clicked = true;
        var base = location.protocol + '//' + location.host + "/dhis"; //+window.location.pathname;
        $location.path('/dashboard').search({ tei: evv.tei,
            program: "eV13Hfo7qiv",
            //  ou: "CPtzIhyn36z",
            ou: ouid2,
            queue: true,
            from: 'amesnimhans' });
        // $window.open(base+'/dhis-web-tracker-capture/index.html#/dashboard?tei='+ev.tei+'&program=a9cQSlDVI2n&ou=CPtzIhyn36z'+$scope.ouId, '_blank');
    };

    $scope.loadQueue2 = function () {

        // Get name of login user
        $.get("../api/me.json?fields=id,name,attributeValues[attribute[id,code,name]]", function (data1) {
            var trackdata = data1;

            $scope.username = trackdata.name;
            console.log($scope.username);
        });

        // map the dataelement value check if its true
        if ($scope.username == "Triage User") {
            $.get("../api/events.json?orgUnit=fMTeIPKpZbI&program=Nb2EygU6dwp&order=created:asc&skipPaging=true", function (data) {

                var trackdata = data;
                console.log(trackdata);

                for (var i = 0; i < trackdata.events.length; i++) {

                    if (trackdata.events[i].eventDate) {
                        var dataval = trackdata.events[i].dataValues;
                        for (var q = 0; q < dataval.length; q++) {
                            var id = dataval[q].dataElement;
                            $scope.registeredid.push(id);
                            if (id == "hBAATiHH0rL") // registration in triage 
                                {

                                    var vall = dataval[q].value;
                                    if (vall == "true") $scope.triagevalue_check = vall;
                                }
                        }
                        var array3 = $scope.global_id_array.filter(function (obj) {
                            return $scope.registeredid.indexOf(obj) == -1;
                        });
                        for (var t = 0; t < array3.length; t++) {

                            /*if(array3[t]=="xeY2hFI7J9p")//Registered in OPD
       {
           /*if($scope.triagevalue_check=="true"){
            $scope.objtrack_opd.push(trackdata.events[i].trackedEntityInstance);
       }
       }*/
                            if (array3[t] == "hBAATiHH0rL") //Registered in Triage
                                $scope.objtrack_triage.push(trackdata.events[i].trackedEntityInstance);
                            /*else if(array3[t]=="T4eGuI8Gn5P")//Registered in Pharmacy
       {
           if($scope.opdvalue_check=="true"){
       $scope.objtrack_pharmacy.push(trackdata.events[i].trackedEntityInstance);
       }
       }
       else if(array3[t]=="kkLvVNLd0Le")//Registered in Lab
       {
           if($scope.opdvalue_check=="true"){
       $scope.objtrack_lab.push(trackdata.events[i].trackedEntityInstance);
       }
       }*/
                        }

                        $scope.registeredid = [];
                        $scope.triagevalue_check = "";
                        $scope.opdvalue_check = "";
                    }
                }
            });
        }

        //USERS OTHERS THEN TRIAGE 


        if ($scope.username == "OPD User" || $scope.username == "Pharmacy User" || $scope.username == "Laboratory User") {
            $.get("../api/events.json?orgUnit=fMTeIPKpZbI&program=Nb2EygU6dwp&order=lastUpdated:asc&skipPaging=true", function (data) {

                var trackdata = data;
                console.log(trackdata);

                for (var i = 0; i < trackdata.events.length; i++) {

                    if (trackdata.events[i].eventDate) {
                        var dataval = trackdata.events[i].dataValues;
                        for (var q = 0; q < dataval.length; q++) {
                            var id = dataval[q].dataElement;
                            $scope.registeredid.push(id);
                            if (id == "hBAATiHH0rL") // registration in triage 
                                {

                                    var vall = dataval[q].value;
                                    if (vall == "true") $scope.triagevalue_check = vall;
                                } else if (id == "xeY2hFI7J9p") // registration in opd 
                                {

                                    var vall = dataval[q].value;
                                    if (vall == "true") $scope.opdvalue_check = vall;
                                } else if (id == "T4eGuI8Gn5P") // registration in pharmacy 
                                {

                                    var vall = dataval[q].value;
                                    if (vall == "true") $scope.pharmacyvalue_check = vall;
                                } else if (id == "kkLvVNLd0Le") // registration in Lab 
                                {

                                    var vall = dataval[q].value;
                                    if (vall == "true") $scope.Labvalue_check = vall;
                                }
                        }
                        var array3 = $scope.global_id_array.filter(function (obj) {
                            return $scope.registeredid.indexOf(obj) == -1;
                        });
                        for (var t = 0; t < array3.length; t++) {

                            if (array3[t] == "xeY2hFI7J9p") //Registered in OPD
                                {
                                    if ($scope.triagevalue_check == "true") {
                                        $scope.objtrack_opd.push(trackdata.events[i].trackedEntityInstance);
                                    }
                                }
                                //else if(array3[t]=="hBAATiHH0rL")//Registered in Triage
                                //$scope.objtrack_triage.push(trackdata.events[i].trackedEntityInstance);
                            else if (array3[t] == "T4eGuI8Gn5P") //Registered in Pharmacy
                                    {
                                        if ($scope.opdvalue_check == "true") {
                                            $scope.objtrack_pharmacy.push(trackdata.events[i].trackedEntityInstance);
                                        }
                                    } else if (array3[t] == "kkLvVNLd0Le") //Registered in Lab
                                    {
                                        if ($scope.opdvalue_check == "true") {
                                            $scope.objtrack_lab.push(trackdata.events[i].trackedEntityInstance);
                                        }
                                    }
                        }

                        $scope.registeredid = [];
                        $scope.triagevalue_check = "";
                        $scope.opdvalue_check = "";
                    }
                }
            });
        }

        if ($scope.username == "Triage User") $scope.loadattributevalue($scope.objtrack_triage);else if ($scope.username == "OPD User") $scope.loadattributevalue($scope.objtrack_opd);else if ($scope.username == "Pharmacy User") $scope.loadattributevalue($scope.objtrack_pharmacy);else if ($scope.username == "Laboratory User") $scope.loadattributevalue($scope.objtrack_lab);
    };

    // GET THE TEI ATTRIBUTES VALUE 
    $scope.loadattributevalue = function (track) {
        $scope.objtrack = track;
        $scope.detail_house_member = [];
        $scope.countval = 0;
        for (var g = 0; g < $scope.objtrack.length; g++) {
            $scope.countval++;

            $.get("../api/trackedEntityInstances/" + $scope.objtrack[g] + ".json?&skipPaging=true", function (data1) {
                var trackdata = data1;

                for (var i = 0; i < trackdata.attributes.length; i++) {
                    var attributepath = trackdata.attributes[i].attribute;

                    $scope.objattribute.push(attributepath);

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

                            //housenumber=aa;
                            var agevalue = aa;
                        } else if (attributepath == "PbEhJPnon0o") //sex    
                        {
                            var aa = trackdata.attributes[i].value;

                            //housenumber=aa;
                            var sexvalue = aa;
                        } else if (attributepath == "Lt9ZrfgAMuw") //mobile number    
                        {
                            var aa = trackdata.attributes[i].value;

                            //housenumber=aa;
                            var mobilevalue = aa;
                        }
                }

                $scope.memberdetail = {
                    "house": house,
                    "namemember": namemember,
                    "agevalue": agevalue,
                    "sexvalue": sexvalue,
                    "mobilevalue": mobilevalue,
                    "TEI": $scope.objtrack[g],

                    "Sno": $scope.countval

                };
                $scope.detail_house_member.push($scope.memberdetail);
            });
        }

        console.log($scope.detail_house_member);
    };

    $scope.gotohome = function () {

        var url = document.location.href = '../dhis-web-dashboard-integration/index.html';
    };
    $scope.gotoreport = function () {
        var url = document.location.href = '../dhis-web-reporting/displayViewReportForm.action';
    };
    $scope.gototriage = function () {
        $scope.objtrack_triage_value = [];
        $.get("../api/events.json?orgUnit=fMTeIPKpZbI&program=Nb2EygU6dwp&order=created:asc&skipPaging=true", function (data) {

            var trackdata = data;
            console.log(trackdata);

            for (var i = 0; i < trackdata.events.length; i++) {

                if (trackdata.events[i].eventDate) {
                    var dataval = trackdata.events[i].dataValues;
                    for (var q = 0; q < dataval.length; q++) {
                        var id = dataval[q].dataElement;
                        $scope.registeredid.push(id);
                        if (id == "hBAATiHH0rL") // registration in triage 
                            {

                                var vall = dataval[q].value;
                                if (vall == "true") $scope.triagevalue_check = vall;
                            }
                    }
                    var array3 = $scope.global_id_array.filter(function (obj) {
                        return $scope.registeredid.indexOf(obj) == -1;
                    });
                    for (var t = 0; t < array3.length; t++) {

                        if (array3[t] == "hBAATiHH0rL") //Registered in Triage
                            $scope.objtrack_triage_value.push(trackdata.events[i].trackedEntityInstance);
                    }

                    $scope.registeredid = [];
                    $scope.triagevalue_check = "";
                    $scope.opdvalue_check = "";
                }
            }
        });
        $scope.loadattributevalue($scope.objtrack_triage_value);
    };
    $scope.got_to_other_then_triage = function (userval) {
        $scope.uservalue = userval;
        $scope.objtrack_opd = [];
        $scope.objtrack_pharmacy = [];
        $scope.objtrack_lab = [];
        $.get("../api/events.json?orgUnit=fMTeIPKpZbI&program=Nb2EygU6dwp&order=lastUpdated:asc&skipPaging=true", function (data) {

            var trackdata = data;
            console.log(trackdata);

            for (var i = 0; i < trackdata.events.length; i++) {

                if (trackdata.events[i].eventDate) {
                    var dataval = trackdata.events[i].dataValues;
                    for (var q = 0; q < dataval.length; q++) {
                        var id = dataval[q].dataElement;
                        $scope.registeredid.push(id);
                        if (id == "hBAATiHH0rL") // registration in triage 
                            {

                                var vall = dataval[q].value;
                                if (vall == "true") $scope.triagevalue_check = vall;
                            } else if (id == "xeY2hFI7J9p") // registration in opd 
                            {

                                var vall = dataval[q].value;
                                if (vall == "true") $scope.opdvalue_check = vall;
                            } else if (id == "T4eGuI8Gn5P") // registration in pharmacy 
                            {

                                var vall = dataval[q].value;
                                if (vall == "true") $scope.pharmacyvalue_check = vall;
                            } else if (id == "kkLvVNLd0Le") // registration in Lab 
                            {

                                var vall = dataval[q].value;
                                if (vall == "true") $scope.Labvalue_check = vall;
                            }
                    }
                    var array3 = $scope.global_id_array.filter(function (obj) {
                        return $scope.registeredid.indexOf(obj) == -1;
                    });
                    for (var t = 0; t < array3.length; t++) {

                        if (array3[t] == "xeY2hFI7J9p") //Registered in OPD
                            {
                                if ($scope.triagevalue_check == "true") {
                                    $scope.objtrack_opd.push(trackdata.events[i].trackedEntityInstance);
                                }
                            }
                            //else if(array3[t]=="hBAATiHH0rL")//Registered in Triage
                            //$scope.objtrack_triage.push(trackdata.events[i].trackedEntityInstance);
                        else if (array3[t] == "T4eGuI8Gn5P") //Registered in Pharmacy
                                {
                                    if ($scope.opdvalue_check == "true") {
                                        $scope.objtrack_pharmacy.push(trackdata.events[i].trackedEntityInstance);
                                    }
                                } else if (array3[t] == "kkLvVNLd0Le") //Registered in Lab
                                {
                                    if ($scope.opdvalue_check == "true") {
                                        $scope.objtrack_lab.push(trackdata.events[i].trackedEntityInstance);
                                    }
                                }
                    }

                    $scope.registeredid = [];
                    $scope.triagevalue_check = "";
                    $scope.opdvalue_check = "";
                }
            }
        });

        if ($scope.uservalue == "OPD User") $scope.loadattributevalue($scope.objtrack_opd);else if ($scope.uservalue == "Pharmacy User") $scope.loadattributevalue($scope.objtrack_pharmacy);else if ($scope.uservalue == "Laboratory User") $scope.loadattributevalue($scope.objtrack_lab);
    };

    $scope.patientdetials = function (details) {
        $scope.patient_detail = details;
        console.log($scope.patient_detail);
        $scope.tei = $scope.patient_detail.TEI;

        var url = document.location.href = '../dhis-web-tracker-capture/index.html#/dashboard?tei=' + $scope.tei + '&program=Nb2EygU6dwp&ou=fMTeIPKpZbI';
    };

    $scope.loadQueue2();
});
