
var trackerCapture = angular.module('trackerCapture');

trackerCapture.controller('HomeController',function(
    $rootScope,
    $scope,
    $modal,
    $location,
    $filter,
    $timeout,
    $q,
    $http,
    Paginator,
    MetaDataFactory,
    DateUtils,
    OrgUnitFactory,
    ProgramFactory,
    AttributesFactory,
    EntityQueryFactory,
    CurrentSelection,
    TEIGridService,
    TEIService,
    GridColumnService,
    ProgramWorkingListService,
    TCStorageService,
    orderByFilter,
    TEService,
    AccessUtils,
    TeiAccessApiService,
    SessionStorageService) {
        TeiAccessApiService.setAuditCancelledSettings(null);
        $scope.trackedEntityTypesById ={};
        var previousProgram = null;
        $scope.base = {};
        $scope.APIURL = DHIS2URL;

   		$scope.isValidProgram = false;

        $scope.superUserAuthority = "";

        $scope.pbfUserAuthority = "";
	
	
        var viewsByType = {
            registration: {
                name: "Register",
                template: "components/registration/registration.html",
                class: "col-lg-10 col-md-12",
                shouldReset: false,
                disabled: true,
                onPostLoad: function(){
                    $rootScope.$broadcast('registrationWidget', {registrationMode: 'REGISTRATION'});
               }
            },
            lists: {
                name: "Lists",
                template: "components/home/lists/lists.html",
                class: "col-xs-12",
                shouldReset: true,
                disabled: false,
            },
            search: {
                name: "Search",
                template: "components/home/search/search.html",
                class: "",
                shouldReset: true,
                disabled: false
            },

        }
        $scope.views = [viewsByType.lists, viewsByType.search, viewsByType.registration];

        var mapOuLevelsToId = function(){
            $scope.base.ouLevelsByLevel = {};
            angular.forEach(ouLevels, function(ouLevel){
                $scope.base.ouLevelsByLevel[ouLevel.level] = ouLevel;
            })
        }

        var ouLevels = CurrentSelection.getOuLevels();
        if(!ouLevels){
            TCStorageService.currentStore.open().done(function(){
                TCStorageService.currentStore.getAll('ouLevels').done(function(response){
                    ouLevels = angular.isObject(response) ? orderByFilter(response, '-level').reverse() : [];
                    CurrentSelection.setOuLevels(orderByFilter(ouLevels, '-level').reverse());
                    mapOuLevelsToId();
                });
            });
        }else{
            mapOuLevelsToId();
        }
        
        var mapOrgUnitToId = function(orgUnit, obj){
            if(orgUnit){
                obj[orgUnit.id] = orgUnit;
                if(orgUnit.children && orgUnit.children.length > 0){
                    angular.forEach(orgUnit.children, function(child){
                        mapOrgUnitToId(child, obj);
                    });
                }
            }
        }

        OrgUnitFactory.getSearchTreeRoot().then(function(response) {
            $scope.orgUnits = response.organisationUnits;
            $scope.base.orgUnitsById = {};
            var byLevel = {};
            angular.forEach($scope.orgUnits, function(ou){
                mapOrgUnitToId(ou, $scope.base.orgUnitsById);
                ou.show = false;
                angular.forEach(ou.children, function(o){
                    o.hasChildren = o.children && o.children.length > 0 ? true : false;
                });
            });
        });



        $scope.$watch('selectedOrgUnit', function(a,b,c) {
            if( angular.isObject($scope.selectedOrgUnit) && !$scope.selectedOrgUnit.loaded){
                loadOrgUnit()
                .then(loadAttributes)
                .then(loadOptionSets)
                .then(loadPrograms)
                .then(loadCachedData);
            }
        });

        var resetView = function(defaultView){
            var viewToSet = defaultView ? defaultView : $scope.views[0];
            viewsByType.registration.disabled = true;
            var loaded = $.grep($scope.views, function(v){ return !v.shouldReset && v.loaded;});
            angular.forEach(loaded, function(v){
                v.loaded = false;
            });
            if($scope.currentView){
                $scope.currentView = null;
                $timeout(function(){ $scope.setCurrentView(viewToSet);});
                return;
            }
            $scope.setCurrentView(viewToSet);
        }

        var loadOrgUnit = function(){
            if($scope.selectedOrgUnit && !$scope.selectedOrgUnit.loaded){
                return OrgUnitFactory.getFromStoreOrServer($scope.selectedOrgUnit.id).then(function(orgUnit){
                    $scope.selectedOrgUnit = orgUnit;
                    $scope.selectedOrgUnit.loaded = true;
                });
            }
            return resolvedEmptyPromise();
        }
/*
        var loadPrograms = function(){
            return ProgramFactory.getProgramsByOu($scope.selectedOrgUnit,true, previousProgram).then(function(response){
                $scope.programs = response.programs;
                $scope.setProgram(response.selectedProgram);
            });
            
        }*/


	var loadPrograms = function(){
        return ProgramFactory.getProgramsByOu($scope.selectedOrgUnit,true, previousProgram).then(function(response){
            $scope.programs = response.programs;

            var programIdFromURL = ($location.search()).program;
            var fullProgram = null;
            if(programIdFromURL) {
                fullProgram = $scope.programs.find(function(program) {
                    return program.id === programIdFromURL;
                });
            }

            if(fullProgram) {
                $scope.setProgram(fullProgram);
            } else {
                $scope.setProgram(response.selectedProgram);
            }
            console.log("-----------------"+Object.entries($scope.userCredentials));
 });
            
        }
        var loadCachedData = function(){
            var frontPageData = CurrentSelection.getFrontPageData();
            if(frontPageData){
                var view = frontPageData.currentView ? $scope.viewsByType[frontPageData.currentView] : null;
                $scope.setProgram(frontPageData.selectedProgram, view);
            }
        }

        var loadAttributes = function(){
            var attributesById = CurrentSelection.getAttributesById();
            if(!$scope.base.attributesById){
                $scope.base.attributesById = {};
                return MetaDataFactory.getAll('attributes').then(function(atts){
                    angular.forEach(atts, function(att){
                        $scope.base.attributesById[att.id] = att;
                    });
                    CurrentSelection.setAttributesById($scope.base.attributesById);
                });
            }
            return resolvedEmptyPromise();
        }

        
        var resolvedEmptyPromise = function(){
            var deferred = $q.defer();
            deferred.resolve();
            return deferred.promise;
        }

        var loadOptionSets = function(){
            if(!$scope.base.optionSets){
                $scope.base.optionSets = $scope.optionSets = {};
                return MetaDataFactory.getAll('optionSets').then(function(optSets){
                    angular.forEach(optSets, function(optionSet){
                        $scope.base.optionSets[optionSet.id] = $scope.optionSets[optionSet.id] = optionSet;
                    });
                    CurrentSelection.setOptionSets($scope.base.optionSets);
                });
            }
            return resolvedEmptyPromise();
        }

        $scope.setProgram = function(selectedProgram, defaultView){
            previousProgram = $scope.base.selectedProgram;
            $scope.base.selectedProgram = $scope.selectedProgram = selectedProgram;
            if(!$scope.base.selectedProgram || !$scope.base.selectedProgram.displayFrontPageList) {
                $scope.views[0].disabled = true;
                defaultView = $scope.views[1];
            }
            else if($scope.base.selectedProgram.id === 'Bv3DaiOd5Ai')
            {
                if($scope.superUserAuthority !== 'YES'){
                    $scope.views[2].disabled = true;
                }
                else{
                    $scope.views[2].disabled = false;
                    defaultView = $scope.views[0];
                }
            }
            else {
                $scope.views[0].disabled = false;
            }
            resetView(defaultView);
            loadCanRegister();
        }
        var loadCanRegister = function(){
            if($scope.selectedProgram){
                var tet = $scope.trackedEntityTypesById[$scope.selectedProgram.trackedEntityType.id];
                var promise;
                if(tet){
                    var def = $q.defer();
                    def.resolve(tet);
                    promise = def.promise;
                }else{
                    promise = TEService.get($scope.selectedProgram.trackedEntityType.id);
                }
                promise.then(function(tet){
                    $scope.trackedEntityTypesById[tet.id] = tet;
                    viewsByType.registration.disabled = !(tet.access.data.write && $scope.selectedProgram.access.data.write);
                });
            }else{
                viewsByType.registration.disabled = false;
            }        
        }

        $scope.setCurrentView = function(view)
        {
            if(view == null){
                resetView();
                return;
            }
            if(!$scope.currentView || $scope.currentView.name !== view.name){
                $scope.currentView = view;
                if($scope.currentView.onSelected){
                    $scope.currentView.onSelected();
                }
            }
            if(!view.shouldReset){
                view.loaded = true;
            }
            loadCanRegister();
        }

        $scope.goToRegistrationWithData = function(registrationPrefill){
            var regView = $scope.views[2];
            regView.loaded = false;
            //Using timeout to make view reset
            $timeout(function(){
                $scope.registrationPrefill = registrationPrefill;
                $scope.setCurrentView(regView);
            });

        }

        $scope.setFrontPageData = function(viewData){
            CurrentSelection.setFrontPageData({
                viewData: viewData,
                selectedView: viewData.name,
                selectedProgram: $scope.selectedProgram,
                selectedOrgUnit: $scope.selectedOrgUnit
            });
        }

        $scope.hasProgramTetAccess = function(){
            if($scope.selectedProgram){
                var tet = $scope.trackedEntityTypesById[$scope.selectedProgram.trackedEntityType.id];
                if(tet){
                    return tet.access.data.read;
                }
            }
            return false;
        }

        $scope.base.setFrontPageData = $scope.setFrontPageData;
        $scope.$on('$includeContentLoaded', function(event, target){
            if($scope.currentView && $scope.currentView.template === target){
                if($scope.currentView.onPostLoad) $scope.currentView.onPostLoad();

            }
          });

        // getting user details

        $scope.usernameAttributeId ='GCyx4hTzy3j';

        // $scope.currentUserDetail = SessionStorageService.get('USER_PROFILE');
        // $scope.currentUserDetails = $scope.currentUserDetail.userCredentials
        // $scope.currentUserName = $scope.currentUserDetails.username;

        

        $http.get('../api/me.json?fields=[id,name,userCredentials]&skipPaging=true')
        .then(function(response) {
            $scope.userCredentials = response.data.userCredentials;
            $scope.currentUserName = response.data.userCredentials.username;
        });

    var getSuperUser = function () {
        $scope.currentUserDetail = SessionStorageService.get('USER_PROFILE');
        $scope.currentUserDetails = $scope.currentUserDetail.userCredentials
        $scope.currentUserName = $scope.currentUserDetails.username;
        $scope.currentUserRoles = $scope.currentUserDetails.userRoles;
        for (var i = 0; i < $scope.currentUserRoles.length; i++) {
            $scope.currentUserRoleAuthorities = $scope.currentUserRoles[i].authorities;

            if($scope.currentUserDetails.userRoles[i].id === 'Y9nNqnTdMMX'){    $scope.pbfUserAuthority = "YES"; }

            for (var j = 0; j < $scope.currentUserRoleAuthorities.length; j++) {
                if ($scope.currentUserRoleAuthorities[j] === "ALL") {
                    //$scope.accessAuthority = true;
                    $scope.superUserAuthority = "YES";
                    break;
                }
            }
        }
    }

    var loadUserPrograms = function () {
        $scope.programs = $scope.userCredentials.programs;
    }
          $scope.hideRegister = function (viewName) {
              if(viewName === 'Register')
              {
                if ($scope.selectedOrgUnit != undefined && $scope.currentUserName != undefined) {
                    $.ajax({
                        type: "GET",
                        dataType: "json",
                        async: false,
                        contentType: "application/json",
                        url: '../api/trackedEntityInstances.json?fields=trackedEntityInstance&filter=' + $scope.usernameAttributeId + ':EQ:' + $scope.currentUserName + '&ou=' + $scope.selectedOrgUnit.id + '&skipPaging=true',
                        success: function (responseData) {
                            $scope.trackedEntities = responseData.trackedEntityInstances;
                            //alert($scope.trackedEntities);
                        }
                    });
                }
                if ($scope.selectedProgram != undefined) {
                    $scope.isValidProgram = false;
                    for (var i = 0; i < $scope.selectedProgram.attributeValues.length; i++) {
                        if ($scope.selectedProgram.attributeValues[i].attribute.code === 'pbfProgram' && $scope.selectedProgram.attributeValues[i].value == "true") {
                            $scope.isValidProgram = true;
                            break;
                        }
                    }                
                }
                if ($scope.selectedProgram != undefined) {
                    if($scope.isValidProgram){
                        if ($scope.trackedEntities.length > 0) {
                            return false
                        }
                        else {
                            return true
                        }
                    }
                    else {
                        return true
                    }
                }   
            }
            else if(viewName != 'Register'){
                    return true
            }
        }

});
