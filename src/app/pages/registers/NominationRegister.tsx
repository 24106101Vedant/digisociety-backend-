import RegisterPage, { ColDef } from "@/app/components/RegisterPage";

const COLUMNS: ColDef[] = [
  { key: "srNo",              label: "Sr. No.",                                          width: "60px"  },
  { key: "memberName",        label: "Name of Member Making Nomination",                 width: "220px" },
  { key: "flatNo",            label: "Flat No.",                                         width: "80px"  },
  { key: "dateFormReceived",  label: "Date Nomination Form Received",                    type: "date"   },
  { key: "nomineeName",       label: "Name(s) of Nominee(s)",                            width: "200px" },
  { key: "nomineeAddress",    label: "Address of Nominee(s)",                            width: "220px" },
  { key: "mcmDate",           label: "Date of MCM in which Nominee Recorded",            type: "date"   },
  { key: "revocationDate",    label: "Date of Revocation of Nomination",                 type: "date"   },
  { key: "nomineeAge",        label: "Age of Nominee",                                   type: "number", width: "90px" },
  { key: "remark",            label: "Remark",                                           width: "130px" },
];

const emptyRow = () => ({
  id:             "",
  srNo:           "",
  memberName:     "",
  flatNo:         "",
  dateFormReceived:"",
  nomineeName:    "",
  nomineeAddress: "",
  mcmDate:        "",
  revocationDate: "",
  nomineeAge:     "",
  remark:         "",
});

export default function NominationRegister() {
  return <RegisterPage title="Nomination Register" columns={COLUMNS} emptyRow={emptyRow} />;
}
