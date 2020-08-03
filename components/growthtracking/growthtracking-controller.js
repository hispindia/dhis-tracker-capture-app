/* global angular */
import React from 'react';
import ReactDOM from 'react-dom';
import App from './App.jsx';

import { defaultConfig } from './datasets/defaultConfig';

const trackerCapture = angular.module('trackerCapture');

const getConfig = (get, create) =>
  get('growthTracker', 'config')
    .then(result => result.data)
    .catch(
      () =>
        create('growthTracker', 'config', defaultConfig)
          .then(() => defaultConfig)
          .catch(err => console.log(err)) // TODO: Figure out what to do if both config collection and config creation fails
    );

trackerCapture
  .controller(
    'GrowthTrackingController',
    (
      $scope,
      $location,
      CurrentSelection,
      DHIS2EventFactory,
      DHIS2DataElementFactory,
      DataStoreFactory,
      SessionStorageService
    ) => {
      $scope.trackedEvents = DHIS2EventFactory.getEventsByProgram(
        $location.search().tei,
        $location.search().program,
        null
      ).then(events => events);
      $scope.dataElements = DHIS2DataElementFactory.getDataElements().then(
        dataElements => dataElements
      );

      $scope.program = $location.search().program;

      $scope.role = SessionStorageService.get(
        'USER_PROFILE'
      ).userCredentials.userRoles.some(
        role => role.authorities.indexOf('ALL') !== -1
      );

      $scope.dataStoreFunctions = DataStoreFactory;
      $scope.trackedEntity = CurrentSelection.get().tei;
    }
  )
  .directive('reactapp', () => ({
    restrict: 'E',

    link: (scope, el) => {
      const initialConfig = getConfig(
        scope.dataStoreFunctions.get,
        scope.dataStoreFunctions.create
      );

      Promise.all([
        scope.trackedEvents,
        scope.dataElements,
        scope.trackedEntity,
        initialConfig,
        scope.program,
        scope.role
      ]).then(values => {
        ReactDOM.render(
          <App
            events={values[0]}
            dataElements={values[1]}
            trackedEntity={values[2]}
            initialConfig={values[3]}
            program={values[4]}
            allowConfigUpdate={values[5]}
            updateConfig={scope.dataStoreFunctions.update}
          />,
          el[0]
        );
      });
    }
  }));
