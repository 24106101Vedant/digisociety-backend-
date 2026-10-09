import RegisterPage, { ColDef } from "@/app/components/RegisterPage";

const COLUMNS: ColDef[] = [
  { key: "srNo",            label: "Sr. No.",                   width: "60px"  },
  { key: "fullNameEn",      label: "Full Name (English)",       width: "200px" },
  { key: "fullNameMr",      label: "Full Name (Marathi)",       width: "200px" },
  { key: "address",         label: "Address",                   width: "250px" },
  { key: "classOfMember",   label: "Class of Member",
    type: "select", options: ["Resident","Owner","Tenant","Committee Member","Chairman","Secretary","Treasurer"], width: "140px" },
  { key: "flatNo",          label: "Flat No.",                  width: "80px"  },
  { key: "transfereeName",  label: "Transferee Full Name",      width: "200px" },
  { key: "transfereeAddr",  label: "Transferee Address",        width: "200px" },
  { key: "transfereeClass", label: "Transferee Class of Member",
    type: "select", options: ["Resident","Owner","Tenant","Committee Member","Chairman","Secretary","Treasurer"], width: "140px" },
  { key: "remark",          label: "Remark",                    width: "130px" },
];

const emptyRow = () => ({
  id:               "",
  srNo:             "",
  fullNameEn:       "",
  fullNameMr:       "",
  address:          "",
  classOfMember:    "",
  flatNo:           "",
  transfereeName:   "",
  transfereeAddr:   "",
  transfereeClass:  "",
  remark:           "",
});

export default function FormJRegister() {
  return <RegisterPage title="Form J Register" columns={COLUMNS} emptyRow={emptyRow} />;
}
