/* global angular, moment, dhis2 */

'use strict';

/* Services */

/**
 * Created by mithilesh.
 */


angular.module('trackerCaptureServices')

    .service('OrganisationUnitService',  function ($http,  $q){
        return {
            //http://127.0.0.1:8090/dhis/api/organisationUnits.json?fields=id,name&filter=level:eq:1&paging=false
            getRootOrganisationUnit: function () {
                var def = $q.defer();
                $http.get('../api/organisationUnits.json.json?fields=id,name&filter=level:eq:1&paging=false').then(function (response) {

                    def.resolve(response.data);
                });
                return def.promise;
            },

            //http://127.0.0.1:8090/dhis/api/organisationUnits.json?fields=id,name&filter=level:eq:2&sortOrder=ASC&paging=false
            getLevel2OrganisationUnit: function () {
              var def = $q.defer();
              $http.get('../api/organisationUnits.json?fields=id,name&filter=level:eq:2&sortOrder=ASC&paging=false').then(function (response) {
                def.resolve(response.data);
              });
            return def.promise;
          },

            getLevel3OrganisationUnit: function () {
                var def = $q.defer();
                $http.get('../api/organisationUnits.json.json?fields=id,name&filter=level:eq:3&sortOrder=ASC&paging=false').then(function (response) {
                    def.resolve(response.data);
                });
                return def.promise;
            },
          //http://127.0.0.1:8090/dhis/api/organisationUnits/Jgc02tIKupW.json?fields=id,name,children[id,name]
          getChildrenOrganisationUnits: function ( parentOrgUnitUid ) {
            var def = $q.defer();
            $http.get('../api/organisationUnits/' + parentOrgUnitUid + ".json?fields=id,name,children[id,name]&paging=false").then(function (response) {
              def.resolve(response.data);
            });
            return def.promise;
          },

          //http://127.0.0.1:8090/dhis/api/organisationUnits/Jgc02tIKupW.json?fields=id,name,children[id,name]
          getOrganisationUnitObject: function ( orgUnitUid ) {
            var def = $q.defer();
            $http.get('../api/organisationUnits/' + orgUnitUid + ".json?fields=id,name,displayName&paging=false").then(function (response) {
              def.resolve(response.data);
            });

            return def.promise;
          },

            //http://127.0.0.1:8090/dhis/api/organisationUnits/Jgc02tIKupW.json?fields=id,name,children[id,name]
          getOrganisationUnitObjectForTEI: function ( orgUnitUid ) {
            //var def = $q.defer();
            var def = $.Deferred();
                $http.get('../api/organisationUnits/' + orgUnitUid + ".json?fields=id,name,displayName&paging=false").then(function (response) {
                    //def.resolve(response.data);
                    def.resolve( response.data );
                });

            //return def.promise;
            return def;
          }


          /*
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

          getOrgunitCode: function ( orgUnitUid ) {
              var def = $q.defer();
              $http.get('../api/organisationUnits/' + orgUnitUid + ".json?fields=id,name,code,parent[id],attributeValues[attribute[id,name,code],value]&paging=false").then(function (response) {

                  def.resolve(response.data);
              });
              return def.promise;
          }
          */

        };
    })

    .service('ProgramAndTEIService',  function ($http,  $q){
      return {
        //127.0.0.1:8090/dhis/api/trackedEntityInstances.json?program=ieLe1vT4Vad&ouMode=ALL&skipPaging=true
        getTrackedEntityInstancesByProgram: function ( programUid ) {
          var def = $q.defer();
          $http.get('../api/trackedEntityInstances.json?program=' + programUid + "&ouMode=ALL&skipPaging=true").then(function (response) {
            def.resolve(response.data);
          });
          return def.promise;
        }
      };
    })

    .service('EHSService',  function ($http,  $q){
      return {
        //http://127.0.0.1:8090/dhis/api/optionSets/RyHTAVjHjGt.json?fields=id,name,options[name,code]
        getOptionsByOptionSet: function ( optionSetUid ) {
          var def = $q.defer();
          $http.get('../api/optionSets/' + optionSetUid + ".json?fields=id,name,options[name,code]&paging=false").then(function (response) {
            def.resolve(response.data);
          });
          return def.promise;
        }

      };
    });