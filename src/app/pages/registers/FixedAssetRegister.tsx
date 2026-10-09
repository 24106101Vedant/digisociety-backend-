import RegisterPage, { ColDef } from "@/app/components/RegisterPage";

const COLUMNS: ColDef[] = [
  { key: "srNo",           label: "Sr. No.",                   width: "60px"  },
  { key: "assetName",      label: "Asset Name",                width: "180px" },
  { key: "category",       label: "Category",
    type: "select", options: ["Furniture","Machinery","Equipment","Vehicle","Building","Land","Computer","Other"], width: "130px" },
  { key: "description",    label: "Description",               width: "200px" },
  { key: "purchaseDate",   label: "Date of Purchase",          type: "date"   },
  { key: "purchaseAmt",    label: "Purchase Amount (Rs.)",     type: "number", width: "150px" },
  { key: "vendor",         label: "Vendor / Supplier",         width: "150px" },
  { key: "invoiceNo",      label: "Invoice No.",               width: "110px" },
  { key: "location",       label: "Location",                  width: "130px" },
  { key: "depreciationPct",label: "Depreciation Rate (%)",     type: "number", width: "150px" },
  { key: "wdv",            label: "Written Down Value (Rs.)",  type: "number", width: "160px" },
  { key: "disposalDate",   label: "Disposal Date",             type: "date"   },
  { key: "disposalAmt",    label: "Disposal Amount (Rs.)",     type: "number", width: "150px" },
  { key: "status",         label: "Status",
    type: "select", options: ["Active","Disposed","Under Repair","Condemned"], width: "110px" },
  { key: "remark",         label: "Remark",                    width: "130px" },
];

const emptyRow = () => ({
  id:              "",
  srNo:            "",
  assetName:       "",
  category:        "",
  description:     "",
  purchaseDate:    "",
  purchaseAmt:     "",
  vendor:          "",
  invoiceNo:       "",
  location:        "",
  depreciationPct: "",
  wdv:             "",
  disposalDate:    "",
  disposalAmt:     "",
  status:          "",
  remark:          "",
});

export default function FixedAssetRegister() {
  return <RegisterPage title="Fixed Asset Register" columns={COLUMNS} emptyRow={emptyRow} />;
}
