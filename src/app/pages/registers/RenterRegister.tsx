import RegisterPage, { ColDef } from "@/app/components/RegisterPage";

const COLUMNS: ColDef[] = [
  { key: "srNo",          label: "Sr. No.",                  width: "60px"  },
  { key: "flatNo",        label: "Flat / Gala No.",           width: "100px" },
  { key: "ownerName",     label: "Owner Name",                width: "200px" },
  { key: "ownerAddress",  label: "Owner Address",             width: "220px" },
  { key: "ownerMobile",   label: "Owner Mobile",              width: "110px" },
  { key: "tenantName",    label: "Tenant Name",               width: "200px" },
  { key: "tenantAddress", label: "Tenant Address",            width: "220px" },
  { key: "tenantMobile",  label: "Tenant Mobile",             width: "110px" },
  { key: "periodFrom",    label: "Period From",               type: "date"   },
  { key: "periodTo",      label: "Period To",                 type: "date"   },
  { key: "renewalDate",   label: "Renewal Date",              type: "date"   },
  { key: "rent",          label: "Monthly Rent (Rs.)",        type: "number", width: "140px" },
  { key: "deposit",       label: "Security Deposit (Rs.)",   type: "number", width: "150px" },
  { key: "agreementStatus", label: "Agreement Status",
    type: "select", options: ["Pending","Received","Expired","Renewed"], width: "140px" },
  { key: "remark",        label: "Remark",                    width: "130px" },
];

const emptyRow = () => ({
  id:              "",
  srNo:            "",
  flatNo:          "",
  ownerName:       "",
  ownerAddress:    "",
  ownerMobile:     "",
  tenantName:      "",
  tenantAddress:   "",
  tenantMobile:    "",
  periodFrom:      "",
  periodTo:        "",
  renewalDate:     "",
  rent:            "",
  deposit:         "",
  agreementStatus: "",
  remark:          "",
});

export default function RenterRegister() {
  return <RegisterPage title="Renter Register" columns={COLUMNS} emptyRow={emptyRow} />;
}
