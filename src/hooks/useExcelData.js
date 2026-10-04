import { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';

export function useExcelData(filePath) {
    const [data, setData] = useState(null);

    useEffect(() => {
        fetch(filePath)
            .then(res => res.arrayBuffer())
            .then(buffer => {
                const workbook = XLSX.read(buffer);
                const sheet = workbook.Sheets[workbook.SheetNames[0]];
                const json = XLSX.utils.sheet_to_json(sheet);
                setData(json);
            });
    }, [filePath]);

    return data;
}