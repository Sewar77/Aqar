import type {
    ButtonHTMLAttributes,
    ReactNode,
} from "react";

import {
    Archive,
    Check,
    Pencil,
    Power,
    PowerOff,
    Trash2,
} from "lucide-react";

type Action =
    | "save"
    | "edit"
    | "delete"
    | "archive"
    | "activate"
    | "deactivate";

type ActionButtonProps = Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    "children"
> & {
    action: Action;
    children?: ReactNode;
};

const actionStyles = {
    save: "bg-brand text-white hover:bg-brand-hover",

    edit: "bg-edit-soft text-edit hover:brightness-95",

    delete:
        "bg-danger-soft text-danger hover:brightness-95",

    archive:
        "bg-archive-soft text-archive hover:brightness-95",

    activate:
        "bg-brand-soft text-brand hover:brightness-95",

    deactivate:
        "bg-inactive-soft text-inactive hover:brightness-95",
} as const;

const actionLabels = {
    save: "حفظ",
    edit: "تعديل",
    delete: "حذف",
    archive: "أرشفة",
    activate: "تفعيل",
    deactivate: "تعطيل",
} as const;

const actionIcons = {
    save: Check,
    edit: Pencil,
    delete: Trash2,
    archive: Archive,
    activate: Power,
    deactivate: PowerOff,
} as const;

/**
 * Shared visual vocabulary for record actions.
 *
 * This component handles presentation only.
 * API calls and business rules belong to the feature layer.
 */
export function ActionButton({
    action,
    children,
    type = "button",
    className = "",
    ...props
}: ActionButtonProps) {
    const Icon = actionIcons[action];

    return (
        <button
            type={type}
            className={`
        inline-flex items-center justify-center gap-2
        rounded-xl px-4 py-2.5 text-sm font-bold
        transition-colors
        disabled:cursor-not-allowed
        disabled:opacity-50
        ${actionStyles[action]}
        ${className}
      `}
            {...props}
        >
            <Icon
                size={16}
                aria-hidden="true"
            />

            <span>
                {children ?? actionLabels[action]}
            </span>
        </button>
    );
}