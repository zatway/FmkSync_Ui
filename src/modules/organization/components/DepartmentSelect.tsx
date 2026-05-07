import {FC} from "react";
import {useDepartments} from "@/modules/organization/hooks/useDepartments";

interface DepartmentsSelectProps {
    selectedDepartmentId?: string;
    onChange: (selectedDepartmentId?: string) => void;
    hiddenNames?: string[];
}

const DepartmentSelect: FC<DepartmentsSelectProps> = ({selectedDepartmentId, onChange, hiddenNames = []}) => {
    const {data: departments, isLoading, isError} = useDepartments();
    const normalizedHidden = new Set(hiddenNames.map((n) => n.trim().toLowerCase()));
    const filteredDepartments = (departments ?? []).filter(
        (d) => !normalizedHidden.has(d.name.trim().toLowerCase()),
    );

    return (
        <select
            className="border rounded-md p-2 bg-background w-full h-10"
            value={selectedDepartmentId ?? ""}
            onChange={(e) => onChange( e.target.value)}
            disabled={isLoading || isError}
        >
            <option value="">
                {isLoading ? "Загрузка..." : isError ? "Ошибка загрузки" : "Выберите подразделение"}
            </option>
            {filteredDepartments.map((d) => (
                <option key={d.id} value={d.id}>
                    {d.name}
                </option>
            ))}
        </select>
    );
};

export default DepartmentSelect;
