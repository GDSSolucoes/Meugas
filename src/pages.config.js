import Dashboard from './pages/Dashboard';
import Orders from './pages/Orders';
import Products from './pages/Products';
import OrderTracking from './pages/OrderTracking';
import Home from './pages/Home';
import PedidosDashboard from './pages/PedidosDashboard';
import AddressSearch from './pages/AddressSearch';
import Employees from './pages/Employees';
import CashAccounts from './pages/CashAccounts';
import PaymentTypes from './pages/PaymentTypes';
import CustomerRegistration from './pages/CustomerRegistration';
import ProductsReport from './pages/ProductsReport';
import PeopleReport from './pages/PeopleReport';
import EmployeesReport from './pages/EmployeesReport';
import SalesReport from './pages/SalesReport';
import OrdersReport from './pages/OrdersReport';
import ReceivableReport from './pages/ReceivableReport';
import Users from './pages/Users';
import People from './pages/People';
import Sales from './pages/Sales';
import Sectors from './pages/Sectors';
import StockMovement from './pages/StockMovement';
import DataCleanup from './pages/DataCleanup';
import CashMovements from './pages/CashMovements';
import FinancialGroups from './pages/FinancialGroups';
import FinancialSubgroups from './pages/FinancialSubgroups';
import ContasAPagar from './pages/ContasAPagar';
import AccountsReceivable from './pages/AccountsReceivable';
import VasilhameManagement from './pages/VasilhameManagement';
import ProductPickupManagement from './pages/ProductPickupManagement';
import Purchases from './pages/Purchases';
import StockTransfer from './pages/StockTransfer';
import StockReport from './pages/StockReport';
import AdminCompanies from './pages/AdminCompanies';
import DataMigration from './pages/DataMigration';
import SectorMaster from './pages/SectorMaster';
import Acquirers from './pages/Acquirers';
import SalesList from './pages/SalesList';
import Facilitadores from './pages/Facilitadores';
import Budget from './pages/Budget';
import AcertoSetores from './pages/AcertoSetores';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Orders": Orders,
    "Products": Products,
    "OrderTracking": OrderTracking,
    "Home": Home,
    "PedidosDashboard": PedidosDashboard,
    "AddressSearch": AddressSearch,
    "Employees": Employees,
    "CashAccounts": CashAccounts,
    "PaymentTypes": PaymentTypes,
    "CustomerRegistration": CustomerRegistration,
    "ProductsReport": ProductsReport,
    "PeopleReport": PeopleReport,
    "EmployeesReport": EmployeesReport,
    "SalesReport": SalesReport,
    "OrdersReport": OrdersReport,
    "ReceivableReport": ReceivableReport,
    "Users": Users,
    "People": People,
    "Sales": Sales,
    "Sectors": Sectors,
    "StockMovement": StockMovement,
    "DataCleanup": DataCleanup,
    "CashMovements": CashMovements,
    "FinancialGroups": FinancialGroups,
    "FinancialSubgroups": FinancialSubgroups,
    "ContasAPagar": ContasAPagar,
    "AccountsReceivable": AccountsReceivable,
    "VasilhameManagement": VasilhameManagement,
    "ProductPickupManagement": ProductPickupManagement,
    "Purchases": Purchases,
    "StockTransfer": StockTransfer,
    "StockReport": StockReport,
    "AdminCompanies": AdminCompanies,
    "DataMigration": DataMigration,
    "SectorMaster": SectorMaster,
    "Acquirers": Acquirers,
    "SalesList": SalesList,
    "Facilitadores": Facilitadores,
    "Budget": Budget,
    "AcertoSetores": AcertoSetores,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};