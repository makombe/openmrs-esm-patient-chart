import React from "react";
import { RouteComponentProps } from "react-router";
import styles from "./patient-chart-summary.css";
import DimensionsCard from "./documentation/dimensions-card.component";
import VitalsCard from "./documentation/vitals-card.component";
import ConditionsCard from "./history/conditions-card.component";
import AllergyCard from "./history/allergy-card.component";
import NotesCard from "./history/notes-card.component";
import ProgramsCard from "./history/programs/programs-card.component";
import MedicationsSummary from "./history/medications/medications-summary.component";

export default function PatientChartSummary(props: PatientChartSummaryProps) {
  const exampleConfig = [
    { name: "conditions" },
    {
      name: "Programs",
      esModule: "@jj-widgets",
      exportName: "programsWidget"
    },
    { name: "medications" },
    { name: "allergies" },
    { name: "notes" },
    { name: "vitals" },
    { name: "heightAndWeight" }
  ];

  const config: configType[] = [
    { name: "conditions" },
    { name: "programs" },
    { name: "medications" },
    { name: "allergies" },
    { name: "notes" },
    { name: "vitals" },
    { name: "heightAndWeight" }
  ];

  const [widgets, setWidgets] = React.useState([]);

  React.useEffect(() => {
    const coreComponents = {
      conditions: ConditionsCard,
      programs: ProgramsCard,
      allergies: AllergyCard,
      notes: NotesCard,
      vitals: VitalsCard,
      heightAndWeight: DimensionsCard,
      medications: MedicationsSummary
    };

    const modulePromises = [];

    const widgets = [];
    config.map(c => {
      if (c["esModule"]) {
        modulePromises.push(System.import(c.esModule));
      }
    });

    //@ts-ignore
    Promise.allSettled(modulePromises).then(modules => {
      const importedWidgets = [];
      let moduleWidgets = {};
      modules.map(m => {
        if (m.status === "fulfilled") {
          moduleWidgets = Object.assign(moduleWidgets, m.value.widgets);
        }
      });

      config.map(c => {
        c.hasOwnProperty("esModule")
          ? widgets.push(moduleWidgets[c.exportName].root)
          : widgets.push(coreComponents[c.name]);
      });
      setWidgets(widgets);
    });
  }, [config]);

  return (
    <main className="omrs-main-content">
      <div className={styles.patientChartCardsContainer}>
        <div className={styles.patientChartCards}>
          {widgets.length > 0 &&
            widgets.map((R, key) => {
              return <R key={key} />;
            })}
        </div>
      </div>
    </main>
  );
}

type PatientChartSummaryProps = RouteComponentProps & {};

type configType = {
  name: string;
  exportName?: string;
  esModule?: string;
};
