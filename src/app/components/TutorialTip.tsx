import { Button, Tooltip } from "@belousovjr/uikit";
import { ReactNode, useMemo, ComponentProps } from "react";
import useTutorial from "../lib/helpers/useTutorial";
import { TutorialStatusOption } from "../types";
import { tutorialStatuses } from "../lib/constants";

export default function TutorialTip({
  hidden,
  disabled,
  status,
  defaultPosition = "bottom",
  className,
  children,
}: {
  hidden?: boolean;
  disabled?: boolean;
  status: TutorialStatusOption;
  defaultPosition?: ComponentProps<typeof Tooltip>["defaultPosition"];
  className?: string;
  children: ReactNode;
}) {
  const content = useMemo<ReactNode>(() => {
    switch (status) {
      case "CONFIG":
        return (
          <span>
            Select the <span className="font-bold">Target</span> dice roll
            values.
          </span>
        );
      case "ROLL":
        return (
          <span>
            <span className="font-bold">Roll</span> the dice.
          </span>
        );
      case "RESET":
        return (
          <span>
            <span className="font-bold">Success!</span> Now restart{" "}
            <span className="font-bold">Simulation</span>.
          </span>
        );
      case "FINAL":
        return null;
      default:
        const unknown: unknown = status;
        throw Error(`Unknown status: ${unknown}`);
    }
  }, [status]);

  const { lastActiveStatus, checkStatus } = useTutorial();

  return !hidden ? (
    <Tooltip
      isOpen={lastActiveStatus === status && !disabled}
      defaultPosition={defaultPosition}
      className={`p-7 z-40 bg-primary-100 ${className ?? ""}`}
      onClick={(e) => e.stopPropagation()}
      arrowDistance={10}
      content={
        <div className="grid gap-6">
          {content}
          <div className="flex justify-end gap-2">
            <Button
              onClick={() => {
                checkStatus(
                  tutorialStatuses[
                    tutorialStatuses.indexOf(lastActiveStatus!) + 1
                  ]
                );
                // checkStatus("FINAL");
              }}
              size="sm"
              variant="secondary"
            >
              OK
            </Button>
          </div>
        </div>
      }
    >
      <span className="flex rounded-md outline-1 outline-transparent outline-offset-1  group-data-[opened=true]/tooltip-activator:outline-primary-100">
        {children}
      </span>
    </Tooltip>
  ) : (
    children
  );
}
