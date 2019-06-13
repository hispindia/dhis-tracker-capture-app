/* global trackerCapture, angular */

var trackerCapture = angular.module('trackerCapture');
trackerCapture.controller('ProfileController',
    function ($rootScope,
        $scope,
        $timeout,
        CurrentSelection,
        SessionStorageService) {
        $scope.editingDisabled = true;
        $scope.enrollmentEditing = false;
        $scope.isInDashboard = true;

        $scope.allAttributes = [];
        $scope.widget = $rootScope.getCurrentWidget($scope);

        // Custom Changes for UPHMIS

        $scope.currentUserName = '';
        $scope.isValidProgram = false;
        $scope.superUserAuthority = "";
        $scope.pbfUserAuthority = "";
        
        /*for (var i = 0; i <= $scope.userCredentials.userRoles.length; i++) {
        if($scope.userCredentials.userRoles[i] != undefined || $scope.userCredentials.userRoles[i] != null)*/
        
		/*
		if ($scope.currentUserDetails.userRoles[i] !== undefined && $scope.currentUserDetails.userRoles[i] !== null && Object.values($scope.currentUserDetails.userRoles[i]) == 'Y9nNqnTdMMX') {
				$scope.pbfUserAuthority = 'PBF'; 
			}
		}*/
							
        //getting user details

        $scope.currentUserDetail = SessionStorageService.get('USER_PROFILE');
        $scope.currentUserDetails = $scope.currentUserDetail.userCredentials
        $scope.currentUserName = $scope.currentUserDetails.username;
        $scope.currentUserRoles = $scope.currentUserDetails.userRoles;
        for (var i = 0; i < $scope.currentUserRoles.length; i++) {
        	if($scope.currentUserDetails.userRoles[i].id === 'Y9nNqnTdMMX'){    $scope.pbfUserAuthority = "YES"; }     	
            $scope.currentUserRoleAuthorities = $scope.currentUserRoles[i].authorities;
            for (var j = 0; j < $scope.currentUserRoleAuthorities.length; j++) {
            	
                if ($scope.currentUserRoleAuthorities[j] === "ALL") {
                    //$scope.accessAuthority = true;
                    $scope.superUserAuthority = "YES";
                    break;
                }
            }
        }

        // for (var j = 0; j < $scope.currentUserDetails.userRoles.length; j++) {
        //     $scope.currentUserRoles.push($scope.currentUserDetails.userRoles[j].id);
        // }

        //Validate Program validation

        $scope.currentProgramDetail = CurrentSelection.currentSelection.pr;
        var programAttributeLength = $scope.currentProgramDetail.attributeValues.length;
        for (var i = 0; i < programAttributeLength; i++) {
            if ($scope.currentProgramDetail.attributeValues[i].attribute.code === 'pbfProgram' && $scope.currentProgramDetail.attributeValues[i].value === 'true') {
                $scope.isValidProgram = true;
                break;
            }
        }
        // Getting user attribute value

        //console.log($scope.isValidProgram);

        $scope.selectedEntityinstance = CurrentSelection.currentSelection.tei.attributes;
        for (var i = 0; i < $scope.selectedEntityinstance.length; i++) {
            if ($scope.selectedEntityinstance[i].code === "user_name") {
                $scope.selectedUserName = $scope.selectedEntityinstance[i].value;
                break;
            }
        }


        // End of UPHMIS Custom changes

        if ($scope.widget) {
            $scope.widgetTitle = $scope.widget.title;
            $scope.widget.getTopBarFields = function () {
                var fields = [];
                angular.forEach($scope.allAttributes, function (attr) {
                    fields.push({ name: attr.displayName, id: attr.id })
                });
                return fields;
            };
        }

        $scope.topBarFilter = function (attr) {
            if ($scope.widget && $scope.widget.topBarFields[attr.id] && $scope.widget.topBarFields[attr.id].show && $scope.selectedTei[attr.id]) return true;
            return false;
        }

        $scope.topBarOrder = function (attr) {
            return $scope.widget.topBarFields[attr.id].order;
        }

        //listen for the selected entity
        var selections = {};
        $scope.$on('dashboardWidgets', function (event, args) {
            listenToBroadCast();
        });

        //listen to changes in profile
        $scope.$on('profileWidget', function (event, args) {
            listenToBroadCast();
        });

        $scope.$watch('widget.useAsTopBar', function (event, args) {
            listenToBroadCast();
        });

        //listen to changes in enrollment editing
        $scope.$on('enrollmentEditing', function (event, args) {
            $scope.enrollmentEditing = args.enrollmentEditing;
        });

        var listenToBroadCast = function () {
            $scope.editingDisabled = true;
            selections = CurrentSelection.get();
            $scope.attributes
            $scope.selectedTei = angular.copy(selections.tei);
            $scope.trackedEntityType = selections.te;
            $scope.selectedProgram = selections.pr;
            $scope.selectedEnrollment = selections.selectedEnrollment;
            $scope.optionSets = selections.optionSets;
            $scope.selectedOrgUnit = selections.orgUnit;
            $scope.trackedEntityForm = null;
            $scope.customForm = null;
            $scope.attributesById = CurrentSelection.getAttributesById();
            var attributeKeys = Object.keys($scope.attributesById);
            $scope.allAttributes = [];
            angular.forEach(attributeKeys, function (key) {
                $scope.allAttributes.push($scope.attributesById[key]);
            });

            //display only those attributes that belong to the selected program
            //if no program, display attributesInNoProgram     
            if ($scope.selectedTei) {
                angular.forEach($scope.selectedTei.attributes, function (att) {
                    $scope.selectedTei[att.attribute] = att.value;
                });
            }
            $timeout(function () {
                $rootScope.$broadcast('registrationWidget', { registrationMode: 'PROFILE', selectedTei: $scope.selectedTei, enrollment: $scope.selectedEnrollment });
            });


        };

        //Custom Changes FOR UPHMIS

        $scope.editProfile = function () {
            if ($scope.isValidProgram) {
                if ($scope.currentUserName === $scope.selectedUserName || $scope.currentUserName === "admin" || $scope.superUserAuthority === "YES" || $scope.pbfUserAuthority === "YES") {
                   
                   return true
                }
                else {
                    return false
                }

            }
            return true;
        }

        // End of CUSTOM Changes

        $scope.enableEdit = function () {
            $scope.teiOriginal = angular.copy($scope.selectedTei);
            $scope.editingDisabled = !$scope.editingDisabled;
            $rootScope.profileWidget.expand = true;
        };

        $scope.cancel = function () {
            $scope.selectedTei = $scope.teiOriginal;
            $scope.editingDisabled = !$scope.editingDisabled;
            $timeout(function () {
                $rootScope.$broadcast('registrationWidget', { registrationMode: 'PROFILE', selectedTei: $scope.selectedTei, enrollment: $scope.selectedEnrollment });
            }, 600);
        };
    });