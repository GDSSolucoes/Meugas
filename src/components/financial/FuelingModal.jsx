import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Search, Edit, Trash2, Check, X, LogOut, Printer, Car, Fuel, AlertCircle
} from "lucide-react";
import { Vehicle } from "@/entities/Vehicle";
import { Fueling } from "@/entities/Fueling";
import { Employee } from "@/entities/Employee";
import { CashMovement } from "@/entities/CashMovement";
import { CashAccount } from "@/entities/CashAccount";
import { FinancialGroup } from "@/entities/FinancialGroup";
import { useToast } from "@/components/ui/use-toast";
import { format, parseISO } from "date-fns";

export default function FuelingModal({ 
  open, 
  onOpenChange, 
  currentUser,
  selectedAccount,
  cashAccounts,
  onFuelingCreated
}) {
  const { toast } = useToast();
  
  // Data states
  const [vehicles, setVehicles] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [fuelings, setFuelings] = useState([]);
  const [groups, setGroups] = useState([]);
  
  // Form states
  const [formData, setFormData] = useState({
    plate: '',
    fleetNumber: '',
    vehicleId: '',
    vehicleType: '',
    vehicleDescription: '',
    driverId: '',
    driverName: '',
    lastFuelingDate: '',
    lastKm: 0,
    fuelingDate: format(new Date(), 'yyyy-MM-dd'),
    currentKm: '',
    liters: '',
    totalValue: '',
    createExpense: false
  });
  
  // UI states
  const [editMode, setEditMode] = useState('none'); // 'none' | 'incluir' | 'modificar'
  const [selectedFueling, setSelectedFueling] = useState(null);
  const [showVehicleSearch, setShowVehicleSearch] = useState(false);
  const [showFuelingSearch, setShowFuelingSearch] = useState(false);
  const [vehicleSearchTerm, setVehicleSearchTerm] = useState('');
  const [plateError, setPlateError] = useState('');

  const isFormDisabled = editMode === 'none';

  useEffect(() => {
    if (open && currentUser?.companyId) {
      loadData();
    }
  }, [open, currentUser]);

  const loadData = async () => {
    try {
      const [vehiclesData, employeesData, fuelingsData, groupsData] = await Promise.all([
        Vehicle.filter({ companyId: currentUser.companyId, active: true }),
        Employee.filter({ companyId: currentUser.companyId, active: true }),
        Fueling.filter({ companyId: currentUser.companyId }, { sort: '-fuelingDate', limit: 100 }),
        FinancialGroup.filter({ companyId: currentUser.companyId, active: true })
      ]);
      
      setVehicles(vehiclesData);
      setEmployees(employeesData);
      setFuelings(fuelingsData);
      setGroups(groupsData);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      plate: '',
      fleetNumber: '',
      vehicleId: '',
      vehicleType: '',
      vehicleDescription: '',
      driverId: '',
      driverName: '',
      lastFuelingDate: '',
      lastKm: 0,
      fuelingDate: format(new Date(), 'yyyy-MM-dd'),
      currentKm: '',
      liters: '',
      totalValue: '',
      createExpense: false
    });
    setSelectedFueling(null);
    setEditMode('none');
    setPlateError('');
  };

  const searchVehicleByPlate = async (plate) => {
    const formattedPlate = plate.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const vehicle = vehicles.find(v => v.plate.toUpperCase().replace(/[^A-Z0-9]/g, '') === formattedPlate);
    
    if (vehicle) {
      // Buscar último abastecimento do veículo
      const vehicleFuelings = fuelings.filter(f => f.vehicleId === vehicle.id);
      const lastFueling = vehicleFuelings.length > 0 ? vehicleFuelings[0] : null;
      
      setFormData(prev => ({
        ...prev,
        plate: vehicle.plate,
        fleetNumber: vehicle.fleetNumber || '',
        vehicleId: vehicle.id,
        vehicleType: vehicle.type,
        vehicleDescription: vehicle.description,
        lastFuelingDate: lastFueling?.fuelingDate || '',
        lastKm: lastFueling?.currentKm || vehicle.initialKm || 0
      }));
      setPlateError('');
    } else {
      setPlateError('Veículo não cadastrado');
      setFormData(prev => ({
        ...prev,
        vehicleId: '',
        vehicleType: '',
        vehicleDescription: '',
        lastFuelingDate: '',
        lastKm: 0
      }));
    }
  };

  const selectVehicle = (vehicle) => {
    const vehicleFuelings = fuelings.filter(f => f.vehicleId === vehicle.id);
    const lastFueling = vehicleFuelings.length > 0 ? vehicleFuelings[0] : null;
    
    setFormData(prev => ({
      ...prev,
      plate: vehicle.plate,
      fleetNumber: vehicle.fleetNumber || '',
      vehicleId: vehicle.id,
      vehicleType: vehicle.type,
      vehicleDescription: vehicle.description,
      lastFuelingDate: lastFueling?.fuelingDate || '',
      lastKm: lastFueling?.currentKm || vehicle.initialKm || 0
    }));
    setPlateError('');
    setShowVehicleSearch(false);
    setVehicleSearchTerm('');
  };

  const handleDriverChange = (driverId) => {
    const driver = employees.find(e => e.id === driverId);
    setFormData(prev => ({
      ...prev,
      driverId: driverId,
      driverName: driver?.name || ''
    }));
  };

  const calculateMetrics = () => {
    const kmTraveled = Number(formData.currentKm) - formData.lastKm;
    const liters = Number(formData.liters);
    const totalValue = Number(formData.totalValue);
    
    const consumption = liters > 0 ? (kmTraveled / liters).toFixed(2) : 0;
    const costPerKm = kmTraveled > 0 ? (totalValue / kmTraveled).toFixed(2) : 0;
    const pricePerLiter = liters > 0 ? (totalValue / liters).toFixed(2) : 0;
    
    return { kmTraveled, consumption, costPerKm, pricePerLiter };
  };

  const validateForm = () => {
    if (!formData.vehicleId) {
      toast({ title: "Erro", description: "Selecione um veículo.", variant: "destructive" });
      return false;
    }
    if (!formData.driverId) {
      toast({ title: "Erro", description: "Selecione um condutor.", variant: "destructive" });
      return false;
    }
    if (!formData.fuelingDate) {
      toast({ title: "Erro", description: "Data é obrigatória.", variant: "destructive" });
      return false;
    }
    if (!formData.currentKm || Number(formData.currentKm) <= 0) {
      toast({ title: "Erro", description: "Km atual deve ser maior que zero.", variant: "destructive" });
      return false;
    }
    if (Number(formData.currentKm) <= formData.lastKm) {
      toast({ title: "Erro", description: "Km atual deve ser maior que o último registro.", variant: "destructive" });
      return false;
    }
    if (!formData.liters || Number(formData.liters) <= 0) {
      toast({ title: "Erro", description: "Quantidade de litros deve ser maior que zero.", variant: "destructive" });
      return false;
    }
    if (!formData.totalValue || Number(formData.totalValue) <= 0) {
      toast({ title: "Erro", description: "Valor deve ser maior que zero.", variant: "destructive" });
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      const metrics = calculateMetrics();
      
      const fuelingData = {
        vehicleId: formData.vehicleId,
        vehiclePlate: formData.plate,
        vehicleDescription: formData.vehicleDescription,
        fleetNumber: formData.fleetNumber,
        driverId: formData.driverId,
        driverName: formData.driverName,
        fuelingDate: formData.fuelingDate,
        currentKm: Number(formData.currentKm),
        liters: Number(formData.liters),
        totalValue: Number(formData.totalValue),
        pricePerLiter: Number(metrics.pricePerLiter),
        kmTraveled: metrics.kmTraveled,
        consumption: Number(metrics.consumption),
        costPerKm: Number(metrics.costPerKm),
        createExpense: formData.createExpense,
        companyId: currentUser.companyId,
        companyName: currentUser.companyName,
        createdByName: currentUser.fullName
      };

      let savedFueling;
      if (editMode === 'modificar' && selectedFueling) {
        savedFueling = await Fueling.update(selectedFueling.id, fuelingData);
        toast({ title: "Sucesso", description: "Abastecimento atualizado!" });
      } else {
        savedFueling = await Fueling.create(fuelingData);
        toast({ title: "Sucesso", description: "Abastecimento registrado!" });
      }

      // Criar lançamento de despesa se checkbox marcado
      if (formData.createExpense && selectedAccount) {
        const account = cashAccounts.find(a => a.id === selectedAccount);
        const combustivelGroup = groups.find(g => 
          g.name.toUpperCase().includes('COMBUSTÍVEL') || 
          g.name.toUpperCase().includes('COMBUSTIVEL')
        );

        const movementData = {
          cashAccountId: selectedAccount,
          cashAccountName: account?.name || '',
          type: 'despesa',
          description: `Abastecimento - ${formData.plate}`,
          amount: Number(formData.totalValue),
          movementDate: formData.fuelingDate,
          groupId: combustivelGroup?.id || '',
          groupName: combustivelGroup?.name || 'COMBUSTÍVEL',
          companyId: currentUser.companyId,
          companyName: currentUser.companyName,
          createdByName: currentUser.fullName
        };

        const movement = await CashMovement.create(movementData);
        
        // Atualizar saldo da conta
        await CashAccount.update(selectedAccount, {
          balance: (account?.balance || 0) - Number(formData.totalValue)
        });

        // Atualizar fueling com ID do movimento
        await Fueling.update(savedFueling.id, { cashMovementId: movement.id });

        toast({ title: "Sucesso", description: "Abastecimento registrado e lançamento de despesa criado!" });
        
        if (onFuelingCreated) onFuelingCreated();
      }

      loadData();
      resetForm();
    } catch (error) {
      console.error("Erro ao salvar:", error);
      toast({ title: "Erro", description: "Falha ao salvar abastecimento.", variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!selectedFueling) return;
    
    if (window.confirm("Tem certeza que deseja excluir este abastecimento?")) {
      try {
        await Fueling.delete(selectedFueling.id);
        toast({ title: "Sucesso", description: "Abastecimento excluído!" });
        loadData();
        resetForm();
      } catch (error) {
        console.error("Erro ao excluir:", error);
        toast({ title: "Erro", description: "Falha ao excluir.", variant: "destructive" });
      }
    }
  };

  const handleSelectFueling = (fueling) => {
    setSelectedFueling(fueling);
    
    // Buscar último abastecimento anterior a este
    const vehicleFuelings = fuelings
      .filter(f => f.vehicleId === fueling.vehicleId && f.id !== fueling.id)
      .sort((a, b) => new Date(b.fuelingDate) - new Date(a.fuelingDate));
    const previousFueling = vehicleFuelings.find(f => new Date(f.fuelingDate) < new Date(fueling.fuelingDate));
    
    setFormData({
      plate: fueling.vehiclePlate,
      fleetNumber: fueling.fleetNumber || '',
      vehicleId: fueling.vehicleId,
      vehicleType: vehicles.find(v => v.id === fueling.vehicleId)?.type || '',
      vehicleDescription: fueling.vehicleDescription,
      driverId: fueling.driverId,
      driverName: fueling.driverName,
      lastFuelingDate: previousFueling?.fuelingDate || '',
      lastKm: previousFueling?.currentKm || 0,
      fuelingDate: fueling.fuelingDate,
      currentKm: fueling.currentKm,
      liters: fueling.liters,
      totalValue: fueling.totalValue,
      createExpense: fueling.createExpense || false
    });
    setShowFuelingSearch(false);
  };

  const metrics = calculateMetrics();
  const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
  const vehicleTypes = { carro: 'Carro', moto: 'Moto', caminhao: 'Caminhão', van: 'Van', utilitario: 'Utilitário', outro: 'Outro' };

  const filteredVehicles = vehicles.filter(v => {
    if (!vehicleSearchTerm) return true;
    const term = vehicleSearchTerm.toLowerCase();
    return v.plate.toLowerCase().includes(term) || 
           v.description.toLowerCase().includes(term) ||
           v.fleetNumber?.toLowerCase().includes(term);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Car className="w-5 h-5" />
            Abastecimento de Veículos
          </DialogTitle>
        </DialogHeader>

        <div className={`space-y-6 ${isFormDisabled ? 'opacity-60' : ''}`}>
          {/* SEÇÃO 1: DADOS DO VEÍCULO */}
          <Card>
            <CardContent className="pt-4">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">DADOS DO VEÍCULO</h3>
              
              {/* Linha 1 - Identificação */}
              <div className="grid grid-cols-12 gap-4 mb-3">
                <div className="col-span-4">
                  <Label className="text-xs font-medium">Placa:</Label>
                  <Input
                    value={formData.plate}
                    onChange={(e) => setFormData(prev => ({ ...prev, plate: e.target.value.toUpperCase() }))}
                    onBlur={(e) => e.target.value && searchVehicleByPlate(e.target.value)}
                    placeholder="ABC1234"
                    maxLength={7}
                    className={`h-8 ${isFormDisabled ? 'bg-slate-100' : 'bg-white'} ${plateError ? 'border-red-500' : ''}`}
                    disabled={isFormDisabled}
                  />
                  {plateError && (
                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {plateError}
                    </p>
                  )}
                </div>
                
                <div className="col-span-3">
                  <Label className="text-xs font-medium">Nº Frota:</Label>
                  <Input
                    value={formData.fleetNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, fleetNumber: e.target.value }))}
                    placeholder="001"
                    className={`h-8 ${isFormDisabled ? 'bg-slate-100' : 'bg-white'}`}
                    disabled={isFormDisabled}
                  />
                </div>
              </div>

              {/* Linha 2 - Dados Automáticos */}
              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-3">
                  <Label className="text-xs font-medium">Tipo:</Label>
                  <Input
                    value={vehicleTypes[formData.vehicleType] || ''}
                    readOnly
                    className="h-8 bg-slate-100 text-slate-600"
                  />
                </div>
                <div className="col-span-9">
                  <Label className="text-xs font-medium">Descrição:</Label>
                  <Input
                    value={formData.vehicleDescription}
                    readOnly
                    className="h-8 bg-slate-100 text-slate-600"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SEÇÃO 2: DADOS DO ABASTECIMENTO */}
          <Card>
            <CardContent className="pt-4">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">DADOS DO ABASTECIMENTO</h3>
              
              {/* Linha 3 - Condutor e Histórico */}
              <div className="grid grid-cols-12 gap-4 mb-3">
                <div className="col-span-5">
                  <Label className="text-xs font-medium">Condutor:</Label>
                  <Select 
                    value={formData.driverId} 
                    onValueChange={handleDriverChange}
                    disabled={isFormDisabled}
                  >
                    <SelectTrigger className={`h-8 ${isFormDisabled ? 'bg-slate-100' : 'bg-white'}`}>
                      <SelectValue placeholder="Selecionar funcionário..." />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map(emp => (
                        <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="col-span-3">
                  <Label className="text-xs font-medium">Último Abastecimento:</Label>
                  <Input
                    value={formData.lastFuelingDate ? format(parseISO(formData.lastFuelingDate), 'dd/MM/yyyy') : '-'}
                    readOnly
                    className="h-8 bg-slate-100 text-slate-600"
                  />
                </div>
                
                <div className="col-span-4">
                  <Label className="text-xs font-medium">Quilometragem (Último):</Label>
                  <Input
                    value={formData.lastKm ? `${formData.lastKm.toLocaleString('pt-BR')} km` : '-'}
                    readOnly
                    className="h-8 bg-slate-100 text-slate-600"
                  />
                </div>
              </div>

              {/* Linha 4 - Dados Atuais */}
              <div className="grid grid-cols-12 gap-4 mb-4">
                <div className="col-span-3">
                  <Label className="text-xs font-medium">Data:</Label>
                  <Input
                    type="date"
                    value={formData.fuelingDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, fuelingDate: e.target.value }))}
                    max={format(new Date(), 'yyyy-MM-dd')}
                    className={`h-8 ${isFormDisabled ? 'bg-slate-100' : 'bg-white'}`}
                    disabled={isFormDisabled}
                  />
                </div>
                
                <div className="col-span-3">
                  <Label className="text-xs font-medium">Km Atual:</Label>
                  <Input
                    type="number"
                    value={formData.currentKm}
                    onChange={(e) => setFormData(prev => ({ ...prev, currentKm: e.target.value }))}
                    placeholder="0"
                    className={`h-8 ${isFormDisabled ? 'bg-slate-100' : 'bg-white'}`}
                    disabled={isFormDisabled}
                  />
                </div>
                
                <div className="col-span-3">
                  <Label className="text-xs font-medium">Qt. Litros:</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.liters}
                    onChange={(e) => setFormData(prev => ({ ...prev, liters: e.target.value }))}
                    placeholder="0,00"
                    className={`h-8 ${isFormDisabled ? 'bg-slate-100' : 'bg-white'}`}
                    disabled={isFormDisabled}
                  />
                </div>
                
                <div className="col-span-3">
                  <Label className="text-xs font-medium">R$:</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.totalValue}
                    onChange={(e) => setFormData(prev => ({ ...prev, totalValue: e.target.value }))}
                    placeholder="0,00"
                    className={`h-8 ${isFormDisabled ? 'bg-slate-100' : 'bg-white'}`}
                    disabled={isFormDisabled}
                  />
                </div>
              </div>

              {/* Métricas calculadas */}
              {formData.currentKm && formData.liters && formData.totalValue && (
                <div className="flex gap-4 mb-4">
                  <Badge variant="outline" className="text-xs">
                    Km Percorridos: {metrics.kmTraveled.toLocaleString('pt-BR')} km
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    Consumo: {metrics.consumption} km/l
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    Custo: R$ {metrics.costPerKm}/km
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    Preço/Litro: R$ {metrics.pricePerLiter}
                  </Badge>
                </div>
              )}

              {/* Checkbox */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="createExpense"
                  checked={formData.createExpense}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, createExpense: checked }))}
                  disabled={isFormDisabled}
                />
                <Label htmlFor="createExpense" className="text-sm">
                  Transformar Abastecimento em despesa
                </Label>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* BARRA DE AÇÕES */}
        <DialogFooter className="bg-slate-100 -mx-6 -mb-6 px-6 py-3 mt-4">
          <div className="flex gap-2 w-full justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (selectedFueling) setEditMode('modificar');
              }}
              disabled={!selectedFueling || editMode !== 'none'}
            >
              <Edit className="w-4 h-4 mr-1" /> Modificar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              disabled={!selectedFueling || editMode !== 'none'}
            >
              <Trash2 className="w-4 h-4 mr-1" /> Excluir
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                resetForm();
                setEditMode('incluir');
              }}
              disabled={editMode !== 'none'}
            >
              <Fuel className="w-4 h-4 mr-1" /> Incluir
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (formData.plate) {
                  setShowVehicleSearch(true);
                } else {
                  setShowFuelingSearch(true);
                }
              }}
              disabled={editMode === 'none'}
            >
              <Search className="w-4 h-4 mr-1" /> Pesquisar
            </Button>
            <Button
              variant="default"
              size="sm"
              className="bg-green-600 hover:bg-green-700"
              onClick={handleSubmit}
              disabled={editMode === 'none'}
            >
              <Check className="w-4 h-4 mr-1" /> Ok
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={resetForm}
              disabled={editMode === 'none'}
            >
              <X className="w-4 h-4 mr-1" /> Cancelar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={editMode !== 'none'}
            >
              <LogOut className="w-4 h-4 mr-1" /> Sair
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={editMode !== 'none'}
            >
              <Printer className="w-4 h-4 mr-1" /> Imprimir
            </Button>
          </div>
        </DialogFooter>

        {/* Modal de Pesquisa de Veículos */}
        <Dialog open={showVehicleSearch} onOpenChange={setShowVehicleSearch}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Pesquisar Veículo</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Buscar por placa, descrição ou nº frota..."
                value={vehicleSearchTerm}
                onChange={(e) => setVehicleSearchTerm(e.target.value)}
              />
              <div className="max-h-80 overflow-auto border rounded">
                <Table>
                  <TableHeader className="bg-slate-50 sticky top-0">
                    <TableRow>
                      <TableHead className="text-xs">Placa</TableHead>
                      <TableHead className="text-xs">Descrição</TableHead>
                      <TableHead className="text-xs">Tipo</TableHead>
                      <TableHead className="text-xs">Nº Frota</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredVehicles.map(v => (
                      <TableRow 
                        key={v.id} 
                        className="cursor-pointer hover:bg-blue-50"
                        onDoubleClick={() => selectVehicle(v)}
                      >
                        <TableCell className="font-mono">{v.plate}</TableCell>
                        <TableCell>{v.description}</TableCell>
                        <TableCell>{vehicleTypes[v.type]}</TableCell>
                        <TableCell>{v.fleetNumber || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <p className="text-xs text-slate-500">Dê duplo clique para selecionar</p>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal de Pesquisa de Abastecimentos */}
        <Dialog open={showFuelingSearch} onOpenChange={setShowFuelingSearch}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Histórico de Abastecimentos</DialogTitle>
            </DialogHeader>
            <div className="max-h-96 overflow-auto border rounded">
              <Table>
                <TableHeader className="bg-slate-50 sticky top-0">
                  <TableRow>
                    <TableHead className="text-xs">Data</TableHead>
                    <TableHead className="text-xs">Placa</TableHead>
                    <TableHead className="text-xs">Condutor</TableHead>
                    <TableHead className="text-xs">Km</TableHead>
                    <TableHead className="text-xs">Litros</TableHead>
                    <TableHead className="text-xs">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fuelings.map(f => (
                    <TableRow 
                      key={f.id} 
                      className="cursor-pointer hover:bg-blue-50"
                      onDoubleClick={() => handleSelectFueling(f)}
                    >
                      <TableCell className="text-xs">{format(parseISO(f.fuelingDate), 'dd/MM/yyyy')}</TableCell>
                      <TableCell className="text-xs font-mono">{f.vehiclePlate}</TableCell>
                      <TableCell className="text-xs">{f.driverName}</TableCell>
                      <TableCell className="text-xs">{f.currentKm?.toLocaleString('pt-BR')}</TableCell>
                      <TableCell className="text-xs">{f.liters?.toFixed(2)}</TableCell>
                      <TableCell className="text-xs">{formatCurrency(f.totalValue)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <p className="text-xs text-slate-500">Dê duplo clique para selecionar</p>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}