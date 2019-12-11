import React from 'react';
import PropTypes from 'prop-types';

import MotherCirclePage from './MotherCirclePage.jsx';
import { eventIds, teiIds } from '../../constants';

class MotherApp extends React.Component {
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
        .value
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
        return {
          index,
          eventDate,
          muac,
          weight,
          height,
          ageInDays,
          completedBy: event.completedBy
        };
      });

    return (
      <MotherCirclePage
        visits={visits}
        config={config}
        toggleConfig={toggleConfig}
        allowConfigUpdate={allowConfigUpdate}
      />
    );
  }
}

MotherApp.propTypes = {
  events: PropTypes.arrayOf(PropTypes.object).isRequired,
  trackedEntity: PropTypes.object.isRequired,
  allowConfigUpdate: PropTypes.bool.isRequired,
  toggleConfig: PropTypes.func.isRequired,
  config: PropTypes.objectOf(
    PropTypes.oneOfType([PropTypes.object, PropTypes.number, PropTypes.string])
  ).isRequired
};

export default MotherApp;
