import DashboardPage from './pages/Dashboard';
import OrdersPage from './pages/Orders';
import ProductsPage from './pages/Products';
import OrderTrackingPage from './pages/OrderTracking';
import HomePage from './pages/Home';
import PedidosDashboardPage from './pages/PedidosDashboard';
import AddressSearchPage from './pages/AddressSearch';
import EmployeesPage from './pages/Employees';
import CashAccountsPage from './pages/CashAccounts';
import PaymentTypesPage from './pages/PaymentTypes';
import CustomerRegistrationPage from './pages/CustomerRegistration';
import ProductsReportPage from './pages/ProductsReport';
import PeopleReportPage from './pages/PeopleReport';
import EmployeesReportPage from './pages/EmployeesReport';
import SalesReportPage from './pages/SalesReport';
import OrdersReportPage from './pages/OrdersReport';
import ReceivableReportPage from './pages/ReceivableReport';
import Users from './pages/Users';
import PeoplePage from './pages/People';
import SalesPage from './pages/Sales';
import SectorsPage from './pages/Sectors';
import StockMovementPage from './pages/StockMovement';
import DataCleanupPage from './pages/DataCleanup';
import CashMovementsPage from './pages/CashMovements';
import FinancialGroupsPage from './pages/FinancialGroups';
import FinancialSubgroupsPage from './pages/FinancialSubgroups';
import ContasAPagar from './pages/ContasAPagar';
import AccountsReceivable from './pages/AccountsReceivable';
import VasilhameManagementPage from './pages/VasilhameManagement';
import ProductPickupManagementPage from './pages/ProductPickupManagement';
import PurchasesPage from './pages/Purchases';
import StockTransfer from './pages/StockTransfer';
import StockReportPage from './pages/StockReport';
import AdminCompaniesPage from './pages/AdminCompanies';
import DataMigrationPage from './pages/DataMigration';
import SectorMaster from './pages/SectorMaster';
import AcquirersPage from './pages/Acquirers';
import SalesListPage from './pages/SalesList';
import FacilitadoresPage from './pages/Facilitadores';
import BudgetPage from './pages/Budget';
import AcertoSetoresPage from './pages/AcertoSetores';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": DashboardPage,
    "Orders": OrdersPage,
    "Products": ProductsPage,
    "OrderTracking": OrderTrackingPage,
    "Home": HomePage,
    "PedidosDashboard": PedidosDashboardPage,
    "AddressSearch": AddressSearchPage,
    "Employees": EmployeesPage,
    "CashAccounts": CashAccountsPage,
    "PaymentTypes": PaymentTypesPage,
    "CustomerRegistration": CustomerRegistrationPage,
    "ProductsReport": ProductsReportPage,
    "PeopleReport": PeopleReportPage,
    "EmployeesReport": EmployeesReportPage,
    "SalesReport": SalesReportPage,
    "OrdersReport": OrdersReportPage,
    "ReceivableReport": ReceivableReportPage,
    "Users": Users,
    "People": PeoplePage,
    "Sales": SalesPage,
    "Sectors": SectorsPage,
    "StockMovement": StockMovementPage,
    "DataCleanup": DataCleanupPage,
    "CashMovements": CashMovementsPage,
    "FinancialGroups": FinancialGroupsPage,
    "FinancialSubgroups": FinancialSubgroupsPage,
    "ContasAPagar": ContasAPagar,
    "AccountsReceivable": AccountsReceivable,
    "VasilhameManagement": VasilhameManagementPage,
    "ProductPickupManagement": ProductPickupManagementPage,
    "Purchases": PurchasesPage,
    "StockTransfer": StockTransfer,
    "StockReport": StockReportPage,
    "AdminCompanies": AdminCompaniesPage,
    "DataMigration": DataMigrationPage,
    "SectorMaster": SectorMaster,
    "Acquirers": AcquirersPage,
    "SalesList": SalesListPage,
    "Facilitadores": FacilitadoresPage,
    "Budget": BudgetPage,
    "AcertoSetores": AcertoSetoresPage,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};