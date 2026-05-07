import {FC} from "react";
import {usePositions} from "@/modules/organization/hooks/usePositions";

interface PositionSelectProps {
    selectedPositionId?: string;
    /** Фильтр должностей по подразделению (регистрация и формы). */
    departmentId?: string;
    onChange: (selectedPositionId?: string) => void;
}

const PositionSelect: FC<PositionSelectProps> = ({ selectedPositionId, departmentId, onChange }) => {
    const { data: positions, isLoading, isError } = usePositions(departmentId);
    const isDepartmentSelected = Boolean(departmentId);
    const isDisabled = !isDepartmentSelected || isLoading || isError;

    return (
        <select
            className="border rounded-md p-2 bg-background w-full h-10"
            value={selectedPositionId ?? ""}
            onChange={(e) => onChange(e.target.value)}
            disabled={isDisabled}
        >
            <option value="">
                {!isDepartmentSelected
                    ? "Сначала выберите подразделение"
                    : isLoading
                        ? "Загрузка..."
                        : isError
                            ? "Ошибка загрузки"
                            : "Выберите должность"}
            </option>
            {positions?.map((p) => (
                <option key={p.id} value={p.id}>
                    {p.name}
                </option>
            ))}
        </select>
    );
};

export default PositionSelect;
