import RegisterPage, { ColDef } from "@/app/components/RegisterPage";

const COLUMNS: ColDef[] = [
  { key: "srNo",             label: "Sr. No.",                          width: "60px"  },
  { key: "dateOfAdmission",  label: "Date of Admission",                type: "date"   },
  { key: "dateEntranceFee",  label: "Date of Payment of Entrance Fee",  type: "date"   },
  { key: "fullName",         label: "Full Name",                        width: "200px" },
  { key: "flatNo",           label: "Flat No.",                         width: "80px"  },
  { key: "address",          label: "Address",                          width: "250px" },
  { key: "permanentAddress", label: "Permanent Address",                width: "200px" },
  { key: "occupation",       label: "Occupation",                       width: "120px" },
  { key: "age",              label: "Age on Date of Admission",         type: "number", width: "80px" },
  { key: "nomineeName",      label: "Name & Address of Nominee (Sec 30)", width: "180px" },
  { key: "dateOfNomination", label: "Date of Nomination",               type: "date"   },
  { key: "dateOfCessation",  label: "Date of Cessation of Membership",  type: "date"   },
  { key: "reasonCessation",  label: "Reason for Cessation",             width: "150px" },
  { key: "remark",           label: "Remark",                           width: "130px" },
];

const emptyRow = () => ({
  id:               "",
  srNo:             "",
  dateOfAdmission:  "",
  dateEntranceFee:  "",
  fullName:         "",
  flatNo:           "",
  address:          "",
  permanentAddress: "",
  occupation:       "",
  age:              "",
  nomineeName:      "",
  dateOfNomination: "",
  dateOfCessation:  "",
  reasonCessation:  "",
  remark:           "",
});

export default function FormIRegister() {
  return <RegisterPage title="Form I Register" columns={COLUMNS} emptyRow={emptyRow} />;
}
