import React, { type ComponentProps, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@carbon/react';
import { ArrowLeftIcon, launchWorkspace, useLayoutType, useSession } from '@openmrs/esm-framework';
import {
  type DefaultPatientWorkspaceProps,
  useOrderBasket,
  useVisitOrOfflineVisit,
} from '@openmrs/esm-patient-common-lib';
import { careSettingUuid, prepMedicationOrderPostData } from '../api/api';
import { ordersEqual } from './drug-search/helpers';
import type { DrugOrderBasketItem } from '../types';
import { DrugOrderForm } from './drug-order-form.component';
import DrugSearch from './drug-search/drug-search.component';
import styles from './add-drug-order.scss';

export interface AddDrugOrderWorkspaceAdditionalProps {
  order: DrugOrderBasketItem;
}

export interface AddDrugOrderWorkspace extends DefaultPatientWorkspaceProps, AddDrugOrderWorkspaceAdditionalProps {}

export default function AddDrugOrderWorkspace({
  order: initialOrder,
  closeWorkspace,
  closeWorkspaceWithSavedChanges,
  promptBeforeClosing,
  patientUuid,
}: AddDrugOrderWorkspace) {
  const { t } = useTranslation();
  const isTablet = useLayoutType() === 'tablet';
  const { orders, setOrders } = useOrderBasket<DrugOrderBasketItem>('medications', prepMedicationOrderPostData);
  const [currentOrder, setCurrentOrder] = useState(initialOrder);
  const session = useSession();
  const { currentVisit } = useVisitOrOfflineVisit(patientUuid);
  const visitStartDate = currentVisit?.startDatetime;

  const cancelDrugOrder = useCallback(() => {
    closeWorkspace({
      onWorkspaceClose: () => launchWorkspace('order-basket'),
      closeWorkspaceGroup: false,
    });
  }, [closeWorkspace]);

  const openOrderForm = useCallback(
    (searchResult: DrugOrderBasketItem) => {
      const existingOrder = orders.find((order) => ordersEqual(order, searchResult));
      if (existingOrder) {
        setCurrentOrder(existingOrder);
      } else {
        setCurrentOrder(searchResult);
      }
    },
    [orders],
  );

  const saveDrugOrder = useCallback(
    (finalizedOrder: DrugOrderBasketItem) => {
      finalizedOrder.careSetting = careSettingUuid;
      finalizedOrder.orderer = session.currentProvider.uuid;
      if (visitStartDate && finalizedOrder.dateActivated) {
        const visitStart = new Date(visitStartDate).getTime();
        const selectedDate = new Date(finalizedOrder.dateActivated).getTime();
        if (selectedDate <= visitStart) {
          // If same date or earlier time, push it slightly ahead (e.g., +1 second)
          finalizedOrder.dateActivated = new Date(visitStart + 3000); // 3 second later
        }
      }

      const newOrders = [...orders];
      const existingOrder = orders.find((order) => ordersEqual(order, finalizedOrder));
      if (existingOrder) {
        newOrders[orders.indexOf(existingOrder)] = {
          ...finalizedOrder,
          // Incomplete orders should be marked completed on saving the form
          isOrderIncomplete: false,
        };
      } else {
        newOrders.push(finalizedOrder);
      }
      setOrders(newOrders);
      closeWorkspaceWithSavedChanges({
        onWorkspaceClose: () => launchWorkspace('order-basket'),
      });
    },
    [orders, setOrders, closeWorkspaceWithSavedChanges, session.currentProvider.uuid, visitStartDate],
  );

  if (!currentOrder) {
    return (
      <>
        {!isTablet && (
          <div className={styles.backButton}>
            <Button
              iconDescription="Return to order basket"
              kind="ghost"
              onClick={cancelDrugOrder}
              renderIcon={(props: ComponentProps<typeof ArrowLeftIcon>) => <ArrowLeftIcon size={24} {...props} />}
              size="sm"
            >
              <span>{t('backToOrderBasket', 'Back to order basket')}</span>
            </Button>
          </div>
        )}
        <DrugSearch openOrderForm={openOrderForm} />
      </>
    );
  } else {
    return (
      <DrugOrderForm
        initialOrderBasketItem={currentOrder}
        patientUuid={patientUuid}
        onSave={saveDrugOrder}
        onCancel={cancelDrugOrder}
        promptBeforeClosing={promptBeforeClosing}
      />
    );
  }
}
