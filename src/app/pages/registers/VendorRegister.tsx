import RegisterPage, { ColDef } from "@/app/components/RegisterPage";

const COLUMNS: ColDef[] = [
  { key: "srNo",          label: "Sr. No.",            width: "60px"  },
  { key: "vendorName",    label: "Vendor Name",         width: "180px" },
  { key: "panNo",         label: "PAN No.",             width: "110px" },
  { key: "gstNo",         label: "GST No.",             width: "150px" },
  { key: "services",      label: "Services",            width: "160px" },
  { key: "mobile",        label: "Mobile",              width: "110px" },
  { key: "email",         label: "E-Mail",              width: "160px" },
  { key: "web",           label: "Website",             width: "150px" },
  { key: "amcStartDate",  label: "AMC Start Date",      type: "date"   },
  { key: "amcDueDate",    label: "AMC Due Date",        type: "date"   },
  { key: "amcAmount",     label: "AMC Amount (Rs.)",    type: "number", width: "130px" },
  { key: "status",        label: "Status",
    type: "select", options: ["Active","Expired","Renewed","Terminated"], width: "110px" },
  { key: "remark",        label: "Remark",              width: "150px" },
];

const emptyRow = () => ({
  id:          "",
  srNo:        "",
  vendorName:  "",
  panNo:       "",
  gstNo:       "",
  services:    "",
  mobile:      "",
  email:       "",
  web:         "",
  amcStartDate:"",
  amcDueDate:  "",
  amcAmount:   "",
  status:      "",
  remark:      "",
});

export default function VendorRegister() {
  return <RegisterPage title="Vendor Register" columns={COLUMNS} emptyRow={emptyRow} />;
}
