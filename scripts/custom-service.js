/* global angular, moment, dhis2 */

'use strict';

/* Custom Services */

/**
 * Created by Mithilesh.
 */
angular.module('trackerCaptureServices')
    .service('SQLViewService', function ($http, $q, $timeout) {
        return {

            getAll: function () {
                var promise = $http.get('../api/sqlViews.json?fields=[id,name]&paging=false').then(function (response) {

                    return response.data ;
                });
                return promise;
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
            //http://127.0.0.1:8090/punjab/api/sqlViews/d7sspGQBa78/data.json?var=optionSetCode:Nawanshahr Urban - School&paging=false
            getOptionsByOprionSetCodeThroughSQLView : function( sqlViewUID, optionSetCode ){
                var def = $.Deferred();
                var param = "var=optionSetCode:" + optionSetCode;
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
    });
