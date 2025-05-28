import { ClassType, DialogBoxProps } from "../types/global";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog"
import ClassDialogForm from "./ClassForm";
import { closeDialoge, stateDialogeBoxes } from "../store/uiSlice";
import { useDispatch, useSelector } from "react-redux";

interface ClassDialogBoxProps<ClassType> extends DialogBoxProps<ClassType> {
	isEditMode: "create" | "update" | "none"
}

function ClassDialogBox({
    data,
    title,
    description,
    isEditMode = "update"
}: ClassDialogBoxProps<ClassType>) {
    const dispatch = useDispatch();
    const dialogeOpen = useSelector((state: any) => state.ui.dialogeBoxes.classDialogBoxOpen);

    return (
        <Dialog open={dialogeOpen} onOpenChange={() => dispatch(closeDialoge(stateDialogeBoxes.classDialogBoxOpen))}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                {( isEditMode === "update" && data != undefined ) ? (
                    <ClassDialogForm  data={data}  isUpdateMode={true}/>
                ) : isEditMode === "create" ? (
                    <ClassDialogForm  isUpdateMode={false}/>
                ) : (
                    <div className="flex flex-col gap-2">
                        <div className="flex gap-1">
                            <p className="font-semibold">Class Name: </p>
                            <p>{data && data.name}</p>
                        </div>
                        <div>
                            <p className="font-semibold">Sections:</p>
                            <ul className="pl-4">
                                {data && data.sections.length > 0 ? (
                                    data.sections.map((section, index) => (
                                        <li key={section._id} className="flex gap-2">
                                            <p className="font-semibold">{index+1}.</p>
                                            <p>{section.name}</p>
                                        </li>
                                    ))
                                ) : (
                                    <p>No sections found</p>
                                )}
                            </ul>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

const RenderClassDialogBox = ({
    dialogBoxOpen,
    dialogBoxData,
    isEditMode,
}: {
    dialogBoxOpen: boolean;
    dialogBoxData: ClassType | null;
    isEditMode: "create" | "update" | "none";
}) => {
    
    if (dialogBoxOpen) {
        if (dialogBoxData !== null && isEditMode === "update") {
            return (
                <ClassDialogBox
                    data={dialogBoxData}
                    title="Update Class"
                    description={
                        isEditMode === "update"
                            ? "Make changes to the class details here. Click save when you're done."
                            : "View the class details here."
                    }
                    isEditMode={isEditMode}
                />
            );
        } else if (dialogBoxData === null && isEditMode === "create") {
            return (
                <ClassDialogBox
                    title="Add new class"
                    description={
                        "Add a new class here. Click save when you're done."
                    }
                    isEditMode={isEditMode}
                />
            );
        } else if (dialogBoxData !== null && isEditMode === "none") {
            return (
                <ClassDialogBox
                    data={dialogBoxData}
                    title="Class Details"
                    description={"View the class details here."}
                    isEditMode={isEditMode}
                />
            );
        }
    }
    {
        dialogBoxOpen && dialogBoxData && (
            <ClassDialogBox
                data={dialogBoxData}
                title="Class Details"
                description={
                    isEditMode === "update"
                        ? "Make changes to the class details here. Click save when you're done."
                        : "View the class details here."
                }
                isEditMode={isEditMode}
            />
        );
    }
};


export default RenderClassDialogBox;