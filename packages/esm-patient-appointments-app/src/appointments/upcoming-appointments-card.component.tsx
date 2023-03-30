import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Checkbox,
  InlineLoading,
  InlineNotification,
  StructuredListHead,
  StructuredListCell,
  StructuredListRow,
  StructuredListBody,
  StructuredListWrapper,
  TextInput,
} from '@carbon/react';
import { formatDate, parseDate } from '@openmrs/esm-framework';
import { useAppointments } from './appointments.resource';
import { ErrorState } from '@openmrs/esm-patient-common-lib';

import styles from './upcoming-appointments-card.scss';
import dayjs from 'dayjs';
interface UpcomingAppointmentsProps {
  patientUuid: string;
}

const UpcomingAppointmentsCard: React.FC<UpcomingAppointmentsProps> = ({ patientUuid }) => {
  const { t } = useTranslation();
  const [upcomingAppointments, setUpcomingAppointments] = useState<Array<string>>([]);
  const startDate = dayjs(new Date().toISOString()).subtract(6, 'month').toISOString();
  const headerTitle = t('upcomingAppointments', 'Upcoming Appointments');
  const {
    data: appointmentsData,
    isError,
    isLoading,
    isValidating,
  } = useAppointments(patientUuid, startDate, new AbortController());

  const handleEarlyAppointmentChange = useCallback((appointmentUuid: string, listSelected: boolean) => {
    if (listSelected) {
      setUpcomingAppointments((prev) => [...prev, appointmentUuid]);
    } else {
      setUpcomingAppointments((prev) => prev.filter((x) => x !== appointmentUuid));
    }
  }, []);

  if (isError) {
    return <ErrorState headerTitle={headerTitle} error={isError} />;
  }
  if (isLoading) {
    <span>
      <InlineLoading />
    </span>;
  }

  if (appointmentsData?.upcomingAppointments?.length) {
    const structuredListBodyRowGenerator = () => {
      return appointmentsData?.upcomingAppointments.map((appointment, i) => (
        <StructuredListRow label key={`row-${i}`}>
          <StructuredListCell>{formatDate(parseDate(appointment.startDateTime), { mode: 'wide' })}</StructuredListCell>
          <StructuredListCell>{appointment.service ? appointment.service.name : '——'}</StructuredListCell>
          <StructuredListCell>
            <Checkbox
              className={styles.checkbox}
              key={appointment.service.appointmentServiceId}
              labelText=""
              id="upcomingAppointment"
              onChange={(e) => handleEarlyAppointmentChange(appointment?.service.uuid, e.target.checked)}
              value={appointment?.service.uuid}
            />
            <TextInput
              className={styles.sectionHidden}
              id="startDateTime"
              name="startDateTime"
              labelText={t('startDateTime', 'Start date')}
              value={appointment.startDateTime}
            />
            <TextInput
              className={styles.sectionHidden}
              id="endDateTime"
              name="endDateTime"
              labelText={t('endDateTime', 'End date')}
              value={appointment.endDateTime}
            />
            <TextInput
              className={styles.sectionHidden}
              id="appointmentKind"
              name="appointmentKind"
              labelText={t('appointmentKind', 'Appointment kind')}
              value={appointment.appointmentKind}
            />
            <TextInput
              className={styles.sectionHidden}
              id="service"
              name="service"
              labelText={t('service', 'Service')}
              value={appointment?.service.uuid}
            />
            <TextInput
              className={styles.sectionHidden}
              id="appointment"
              name="appointment"
              labelText={t('appointment', 'Appointment')}
              value={appointment.uuid}
            />
          </StructuredListCell>
        </StructuredListRow>
      ));
    };

    return (
      <div>
        <p className={styles.sectionTitle}>{t('upcomingAppt', 'Upcoming Appointments')}</p>
        <StructuredListWrapper>
          <StructuredListHead>
            <StructuredListRow head>
              <StructuredListCell head>{t('date', 'Date')}</StructuredListCell>
              <StructuredListCell head>{t('appointmentTyped', 'Appointment Type')}</StructuredListCell>
              <StructuredListCell head>{t('action', 'Provider action')}</StructuredListCell>
            </StructuredListRow>
          </StructuredListHead>
          <StructuredListBody>{structuredListBodyRowGenerator()}</StructuredListBody>
        </StructuredListWrapper>
      </div>
    );
  } else {
    return (
      <InlineNotification
        kind={'info'}
        lowContrast
        className={styles.inlineNotification}
        title={t('upcomingAppts', 'Upcoming appointments')}
        subtitle={t('noUpcomingAppt', 'No upcoming appointments found')}
      />
    );
  }
};

export default UpcomingAppointmentsCard;
