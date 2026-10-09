import RegisterPage, { ColDef } from "@/app/components/RegisterPage";

const COLUMNS: ColDef[] = [
  { key: "srNo",           label: "Sr. No.",                        width: "60px"  },
  { key: "memberName",     label: "Member Name",                    width: "200px" },
  { key: "flatNo",         label: "Flat No.",                       width: "80px"  },
  { key: "bankName",       label: "Bank / Financial Institution",   width: "200px" },
  { key: "loanAmt",        label: "Loan Amount (Rs.)",              type: "number", width: "140px" },
  { key: "lienDate",       label: "Date of Lien Created",           type: "date"   },
  { key: "lienExpiry",     label: "Lien Expiry Date",               type: "date"   },
  { key: "sharesCovered",  label: "Shares Covered (Cert Nos.)",     width: "160px" },
  { key: "noOfShares",     label: "No. of Shares",                  type: "number", width: "100px" },
  { key: "mcmApprovalDate",label: "MCM Approval Date",              type: "date"   },
  { key: "lienReleasedDate",label: "Lien Released Date",            type: "date"   },
  { key: "status",         label: "Status",
    type: "select", options: ["Active","Released","Expired"], width: "100px" },
  { key: "remark",         label: "Remark",                         width: "130px" },
];

const emptyRow = () => ({
  id:               "",
  srNo:             "",
  memberName:       "",
  flatNo:           "",
  bankName:         "",
  loanAmt:          "",
  lienDate:         "",
  lienExpiry:       "",
  sharesCovered:    "",
  noOfShares:       "",
  mcmApprovalDate:  "",
  lienReleasedDate: "",
  status:           "",
  remark:           "",
});

export default function LienRegister() {
  return <RegisterPage title="Lien Register" columns={COLUMNS} emptyRow={emptyRow} />;
}
