import RegisterPage, { ColDef } from "@/app/components/RegisterPage";

const COLUMNS: ColDef[] = [
  { key: "srNo",          label: "Sr. No.",               width: "60px"  },
  { key: "bankName",      label: "Bank Name",              width: "160px" },
  { key: "branchName",    label: "Branch Name",            width: "140px" },
  { key: "fdNo",          label: "FD Number",              width: "120px" },
  { key: "fdAmount",      label: "FD Amount (Rs.)",        type: "number", width: "130px" },
  { key: "openDate",      label: "Opening Date",           type: "date"   },
  { key: "maturityDate",  label: "Maturity Date",          type: "date"   },
  { key: "tenure",        label: "Tenure (Months)",        type: "number", width: "120px" },
  { key: "interestRate",  label: "Interest Rate (%)",      type: "number", width: "120px" },
  { key: "maturityAmt",   label: "Maturity Amount (Rs.)",  type: "number", width: "140px" },
  { key: "renewalDate",   label: "Renewal Date",           type: "date"   },
  { key: "status",        label: "Status",
    type: "select", options: ["Active","Matured","Renewed","Closed"], width: "100px" },
  { key: "remark",        label: "Remark",                 width: "130px" },
];

const emptyRow = () => ({
  id:           "",
  srNo:         "",
  bankName:     "",
  branchName:   "",
  fdNo:         "",
  fdAmount:     "",
  openDate:     "",
  maturityDate: "",
  tenure:       "",
  interestRate: "",
  maturityAmt:  "",
  renewalDate:  "",
  status:       "",
  remark:       "",
});

export default function FDRegister() {
  return <RegisterPage title="FD Register" columns={COLUMNS} emptyRow={emptyRow} />;
}
