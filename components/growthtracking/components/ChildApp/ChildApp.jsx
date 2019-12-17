import React from 'react';
import PropTypes from 'prop-types';

import CirclePage from './CirclePage';
import {
  getWeightForLength,
  getWeightForAge,
  getLengthForAge,
  getMUACForAge,
  getBMIForAge
} from '../../functions';
import { teiIds, eventIds } from '../../constants';

class ChildApp extends React.Component {
  getPatientData = trackedEntity => ({
    firstname:
      trackedEntity.attributes.find(
        attr => attr.attribute === teiIds.firstname
      ) &&
      trackedEntity.attributes.find(attr => attr.attribute === teiIds.firstname)
        .value,
    lastname:
      trackedEntity.attributes.find(
        attr => attr.attribute === teiIds.lastname
      ) &&
      trackedEntity.attributes.find(attr => attr.attribute === teiIds.lastname)
        .value,
    birthdate:
      trackedEntity.attributes.find(
        attr => attr.attribute === teiIds.birthdate
      ) &&
      trackedEntity.attributes.find(attr => attr.attribute === teiIds.birthdate)
        .value,
    gender:
      trackedEntity.attributes.find(attr => attr.attribute === teiIds.gender) &&
      trackedEntity.attributes.find(attr => attr.attribute === teiIds.gender)
        .value === 'Female'
  });

  render() {
    const {
      events,
      trackedEntity,
      config,
      toggleConfig,
      allowConfigUpdate
    } = this.props;

    if (events.length === 0) {
      return (
        <div className="alert alert-warning">
          No events have been registered
        </div>
      );
    }

    const patient = this.getPatientData(trackedEntity);

    const completedEvents = events.reduce((acc, val) => {
      if (!val.completedDate) return acc;
      if (acc.find(v => v.eventDate === val.eventDate)) return acc;
      acc.push(val);
      return acc;
    }, []);

    if (completedEvents.length === 0) {
      return (
        <div className="alert alert-warning">No completed events found.</div>
      );
    }

    const visits = completedEvents
      .sort((a, b) => a.eventDate < b.eventDate)
      .map((event, index) => {
        const eventDate = new Date(event.eventDate);

        // Get a more accurate age by calculating age based on birth date and event date
        const ageInDays = Math.floor(
          (Date.parse(eventDate) - Date.parse(patient.birthdate)) / 86400000
        );
        const muac =
          event.dataValues.find(val => val.dataElement === eventIds.muac) &&
          Number(
            event.dataValues.find(val => val.dataElement === eventIds.muac)
              .value
          );
        const weight =
          event.dataValues.find(val => val.dataElement === eventIds.weight) &&
          Number(
            event.dataValues.find(val => val.dataElement === eventIds.weight)
              .value
          );
        const height =
          event.dataValues.find(val => val.dataElement === eventIds.height) &&
          Number(
            event.dataValues.find(val => val.dataElement === eventIds.height)
              .value
          );
        const wfa = event.dataValues.find(val => val.dataElement === eventIds.wfa)&&
        Number(
          event.dataValues.find(val => val.dataElement === eventIds.wfa)
            .value
        );
        const hfa = event.dataValues.find(val => val.dataElement === eventIds.hfa)&&
        Number(
          event.dataValues.find(val => val.dataElement === eventIds.hfa)
            .value
        );
        const wfh = event.dataValues.find(val => val.dataElement === eventIds.wfh)&&
        Number(
          event.dataValues.find(val => val.dataElement === eventIds.wfh)
            .value
        );
      
        const bmi = event.dataValues.find(val => val.dataElement === eventIds.bmi)&&
        Number(
          event.dataValues.find(val => val.dataElement === eventIds.bmi)
            .value
        ).toFixed("2");;
        

        //const bmi = weight / (height / 100) ** 2;

      
        // const rawWfl = getWeightForLength(patient.gender, weight, height);
        // const rawWfa = getWeightForAge(patient.gender, weight, ageInDays);
        // const rawLhfa = getLengthForAge(patient.gender, height, ageInDays);
        // const rawAcfa = getMUACForAge(patient.gender, muac, ageInDays);
        // const rawBfa = getBMIForAge(patient.gender, bmi, ageInDays);
        return {
          index,
          eventDate,
          ageInDays,
          muac,
          weight,
          height,
          bmi,
          // wfl: rawWfl === null ? null : Math.round(rawWfl * 100) / 100,
          // wfa: rawWfa === null ? null : Math.round(rawWfa * 100) / 100,
          // lhfa: rawLhfa === null ? null : Math.round(rawLhfa * 100) / 100,          
          wfl: wfh === null ? null : wfh,
          wfa: wfa === null ? null : wfa,
          lhfa: hfa === null ? null : hfa,
          bfa: bmi === null ? null : bmi,
          acfa: muac === null ? null : muac,
          completedBy: event.completedBy
        };
      });

    return (
      <CirclePage
        visits={visits}
        patient={patient}
        toggleConfig={toggleConfig}
        config={config}
        allowConfigUpdate={allowConfigUpdate}
      />
    );
  }
}

ChildApp.propTypes = {
  events: PropTypes.arrayOf(PropTypes.object).isRequired,
  trackedEntity: PropTypes.object.isRequired,
  allowConfigUpdate: PropTypes.bool.isRequired,
  toggleConfig: PropTypes.func.isRequired,
  config: PropTypes.objectOf(
    PropTypes.oneOfType([PropTypes.object, PropTypes.number, PropTypes.string])
  ).isRequired
};

export default ChildApp;
