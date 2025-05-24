import { faDiscord, faPython } from "@fortawesome/free-brands-svg-icons";
import { faFileCsv, faFileLines } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { FileIcon } from "lucide-react";

export default function CalculateFileIcon({filename}) {
    let extension = filename.split('.').at(-1);
    if (extension === 'py') {
        return <FontAwesomeIcon icon={faPython} className="size-4"/>
    }
    if (extension === 'txt') {
        return <FontAwesomeIcon icon={faFileLines} className="size-4" />
    }
    if (extension === 'csv') {
        return <FontAwesomeIcon icon={faFileCsv} className="size-4" />
    }

    return <FileIcon className="size-4" />
}