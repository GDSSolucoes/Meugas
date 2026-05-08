
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MapPin, Search, UserPlus, Trash2, Plus } from "lucide-react";
import { Person } from "@/entities/Person";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function AddressSearchPage() {
  const [people, setPeople] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [showPersonForm, setShowPersonForm] = useState(false);
  const [searchType, setSearchType] = useState('cep');
  const [searchCep, setSearchCep] = useState('');
  const [searchStreet, setSearchStreet] = useState('');
  const [searchNumber, setSearchNumber] = useState('');
  const [foundAddress, setFoundAddress] = useState(null);

  const [currentPerson, setCurrentPerson] = useState({
    name: '',
    document: '',
    email: '',
    phone: [''],
    type: 'cliente',
    address: {
      zipcode: '',
      street: '',
      number: '',
      neighborhood: '',
      referencePoint: '',
      city: '',
      state: ''
    },
    active: true
  });

  useEffect(() => {
    loadPeople();
  }, []);

  const loadPeople = async () => {
    const data = await Person.filter({ sort: '-createdAt' });
    setPeople(data);
  };

  const searchAddressByCEP = async (cep) => {
    if (cep.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await response.json();
        if (!data.erro) {
          return {
            street: data.logradouro,
            neighborhood: data.bairro,
            city: data.localidade,
            state: data.uf,
            zipcode: cep
          };
        }
      } catch (error) {
        console.error("Erro ao buscar CEP:", error);
      }
    }
    return null;
  };

  const handleSearchByCep = async () => {
    if (!searchCep) {
      alert("Por favor, digite um CEP para buscar.");
      return;
    }

    const cepNumbers = searchCep.replace(/\D/g, '');
    if (cepNumbers.length !== 8) {
      alert("CEP deve ter 8 dígitos.");
      return;
    }

    const addressData = await searchAddressByCEP(cepNumbers);
    if (!addressData) {
      alert("CEP não encontrado.");
      return;
    }

    setFoundAddress(addressData);

    const results = people.filter(person =>
      person.address?.zipcode === cepNumbers
    );

    setSearchResults(results);

    if (results.length === 0) {
      setCurrentPerson(prev => ({
        ...prev,
        address: addressData
      }));
      setShowPersonForm(true);
    }
  };

  const handleSearchByStreet = () => {
    if (!searchStreet.trim()) {
      alert("Por favor, digite uma rua para buscar.");
      return;
    }

    const streetLower = searchStreet.toLowerCase().trim();
    let results = people.filter(person => {
      const personStreet = person.address?.street?.toLowerCase() || '';
      return personStreet.includes(streetLower);
    });

    if (searchNumber.trim()) {
      const numberLower = searchNumber.toLowerCase().trim();
      results = results.filter(person => {
        const personNumber = (person.address?.number || '').toLowerCase();
        return personNumber === numberLower;
      });

      if (results.length === 0) {
        setCurrentPerson(prev => ({
          ...prev,
          address: {
            ...prev.address,
            street: searchStreet,
            number: searchNumber
          }
        }));
        setShowPersonForm(true);
      }
    } else {
      if (results.length === 0) {
        setCurrentPerson(prev => ({
          ...prev,
          address: {
            ...prev.address,
            street: searchStreet
          }
        }));
        setShowPersonForm(true);
      }
    }

    setSearchResults(results);

    setFoundAddress({
      street: searchStreet,
      number: searchNumber.trim(),
      city: '',
      state: '',
      zipcode: ''
    });
  };

  const handlePhoneChange = (index, value) => {
    const newPhones = [...currentPerson.phone];
    newPhones[index] = value;
    setCurrentPerson(prev => ({ ...prev, phone: newPhones }));
  };

  const addPhone = () => {
    setCurrentPerson(prev => ({ ...prev, phone: [...prev.phone, ''] }));
  };

  const removePhone = (index) => {
    setCurrentPerson(prev => ({
      ...prev,
      phone: prev.phone.filter((_, i) => i !== index)
    }));
  };

  const handleSelectPerson = (person) => {
    // Redirect back to Orders page with person data
    const personData = encodeURIComponent(JSON.stringify(person));
    window.location.href = createPageUrl("Orders") + `?selectedPerson=${personData}`;
  };

  const handleSavePerson = async (e) => {
    e.preventDefault();
    try {
      const newPerson = await Person.create(currentPerson);
      setShowPersonForm(false);
      resetPersonForm();
      loadPeople();

      // Redirect back to Orders page with new person data
      const personData = encodeURIComponent(JSON.stringify(newPerson));
      window.location.href = createPageUrl("Orders") + `?selectedPerson=${personData}`;
    } catch (error) {
      console.error("Erro ao salvar pessoa:", error);
    }
  };

  const resetPersonForm = () => {
    setCurrentPerson({
      name: '',
      document: '',
      email: '',
      phone: [''],
      type: 'cliente',
      address: {
        zipcode: '',
        street: '',
        number: '',
        neighborhood: '',
        referencePoint: '',
        city: '',
        state: ''
      },
      active: true
    });
  };

  const clearSearch = () => {
    setSearchResults([]);
    setSearchCep('');
    setSearchStreet('');
    setSearchNumber('');
    setFoundAddress(null);
  };

  const getTypeBadge = (type) => {
    const colors = {
      cliente: "bg-blue-100 text-blue-800",
      fornecedor: "bg-green-100 text-green-800",
      pontoVenda: "bg-purple-100 text-purple-800"
    };
    return <Badge className={colors[type]}>{type}</Badge>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 mb-2">Busca por Endereço</h1>
            <p className="text-slate-600">Encontre pessoas pelo endereço ou cadastre novos clientes</p>
          </div>
          <Link to={createPageUrl("Orders")}>
            <Button variant="outline">
              Voltar aos Pedidos
            </Button>
          </Link>
        </div>

        {/* Formulário de Cadastro de Pessoa */}
        {showPersonForm && (
          <Card className="mb-8 bg-white/90 backdrop-blur-sm border-slate-200/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                Nenhuma Pessoa Encontrada - Cadastrar Nova Pessoa
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSavePerson} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Nome/Razão Social *</Label>
                    <Input
                      value={currentPerson.name}
                      onChange={(e) => setCurrentPerson(prev => ({ ...prev, name: e.target.value }))}
                      required
                      className="bg-white/80"
                    />
                  </div>
                  <div>
                    <Label>CPF/CNPJ</Label>
                    <Input
                      value={currentPerson.document}
                      onChange={(e) => setCurrentPerson(prev => ({ ...prev, document: e.target.value }))}
                      className="bg-white/80"
                    />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={currentPerson.email}
                      onChange={(e) => setCurrentPerson(prev => ({ ...prev, email: e.target.value }))}
                      className="bg-white/80"
                    />
                  </div>
                  <div>
                    <Label>Tipo *</Label>
                    <Select
                      value={currentPerson.type}
                      onValueChange={(value) => setCurrentPerson(prev => ({ ...prev, type: value }))}
                    >
                      <SelectTrigger className="bg-white/80">
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cliente">Cliente</SelectItem>
                        <SelectItem value="fornecedor">Fornecedor</SelectItem>
                        <SelectItem value="pontoVenda">Ponto de Venda</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Telefones</h3>
                  <div className="space-y-2">
                    {currentPerson.phone.map((phone, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          value={phone}
                          onChange={(e) => handlePhoneChange(index, e.target.value)}
                          placeholder="Ex: (11) 99999-9999"
                          className="bg-white/80"
                        />
                        <Button type="button" variant="destructive" size="icon" onClick={() => removePhone(index)} disabled={currentPerson.phone.length === 1}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={addPhone} className="mt-2">
                    <Plus className="w-4 h-4 mr-2" /> Adicionar Telefone
                  </Button>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Endereço</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                     <div className="md:col-span-1">
                      <Label>CEP</Label>
                      <Input
                        value={currentPerson.address.zipcode}
                        onChange={(e) => setCurrentPerson(prev => ({
                          ...prev,
                          address: { ...prev.address, zipcode: e.target.value.replace(/\D/g, '') }
                        }))}
                        placeholder="00000-000"
                        className="bg-white/80"
                      />
                    </div>
                    <div className="md:col-span-3">
                      <Label>Rua/Logradouro</Label>
                      <Input
                        value={currentPerson.address.street}
                        onChange={(e) => setCurrentPerson(prev => ({
                          ...prev,
                          address: { ...prev.address, street: e.target.value }
                        }))}
                        className="bg-white/80"
                      />
                    </div>
                    <div className="md:col-span-1">
                      <Label>Número</Label>
                      <Input
                        value={currentPerson.address.number}
                        onChange={(e) => setCurrentPerson(prev => ({
                          ...prev,
                          address: { ...prev.address, number: e.target.value }
                        }))}
                        className="bg-white/80"
                      />
                    </div>
                     <div className="md:col-span-3">
                      <Label>Bairro</Label>
                      <Input
                        value={currentPerson.address.neighborhood}
                        onChange={(e) => setCurrentPerson(prev => ({
                          ...prev,
                          address: { ...prev.address, neighborhood: e.target.value }
                        }))}
                        className="bg-white/80"
                      />
                    </div>
                    <div className="md:col-span-4">
                      <Label>Ponto de Referência</Label>
                      <Input
                        value={currentPerson.address.referencePoint}
                        onChange={(e) => setCurrentPerson(prev => ({
                          ...prev,
                          address: { ...prev.address, referencePoint: e.target.value }
                        }))}
                        className="bg-white/80"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label>Cidade</Label>
                      <Input
                        value={currentPerson.address.city}
                        onChange={(e) => setCurrentPerson(prev => ({
                          ...prev,
                          address: { ...prev.address, city: e.target.value }
                        }))}
                        className="bg-white/80"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label>Estado</Label>
                      <Input
                        value={currentPerson.address.state}
                        onChange={(e) => setCurrentPerson(prev => ({
                          ...prev,
                          address: { ...prev.address, state: e.target.value }
                        }))}
                        className="bg-white/80"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button type="submit" className="bg-green-600 hover:bg-green-700">
                    Salvar Pessoa
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowPersonForm(false)}>
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Formulário de Busca */}
        {!showPersonForm && (
          <Card className="mb-8 bg-white/90 backdrop-blur-sm border-slate-200/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Buscar por Endereço
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <Label>Tipo de Busca</Label>
                  <Select value={searchType} onValueChange={setSearchType}>
                    <SelectTrigger className="bg-white/80">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cep">Por CEP</SelectItem>
                      <SelectItem value="street">Por Rua e Número</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {searchType === 'cep' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <Label>CEP</Label>
                      <Input
                        value={searchCep}
                        onChange={(e) => setSearchCep(e.target.value.replace(/\D/g, ''))}
                        placeholder="00000-000"
                        maxLength={8}
                        className="bg-white/80"
                      />
                    </div>
                    <div className="flex items-end">
                      <Button onClick={handleSearchByCep} className="bg-blue-600 hover:bg-blue-700 w-full">
                        <Search className="w-4 h-4 mr-2" />
                        Buscar
                      </Button>
                    </div>
                  </div>
                )}

                {searchType === 'street' && (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-2">
                      <Label>Rua/Logradouro</Label>
                      <Input
                        value={searchStreet}
                        onChange={(e) => setSearchStreet(e.target.value)}
                        placeholder="Ex: Rua das Flores"
                        className="bg-white/80"
                      />
                    </div>
                    <div>
                      <Label>Número (opcional)</Label>
                      <Input
                        value={searchNumber}
                        onChange={(e) => setSearchNumber(e.target.value)}
                        placeholder="123"
                        className="bg-white/80"
                      />
                    </div>
                    <div className="flex items-end">
                      <Button onClick={handleSearchByStreet} className="bg-blue-600 hover:bg-blue-700 w-full">
                        <Search className="w-4 h-4 mr-2" />
                        Buscar
                      </Button>
                    </div>
                  </div>
                )}

                {(searchResults.length > 0 || foundAddress) && (
                  <div className="flex justify-between items-center">
                    <div></div>
                    <Button variant="outline" onClick={clearSearch}>
                      Limpar Busca
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Endereço Encontrado */}
        {foundAddress && !showPersonForm && (
          <Card className="mb-6 bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-blue-800">
                <MapPin className="w-5 h-5" />
                <div>
                  <p className="font-semibold">Endereço: {foundAddress.street}{foundAddress.number ? `, ${foundAddress.number}`: ''}</p>
                  {foundAddress.neighborhood && <p className="text-sm">{foundAddress.neighborhood}</p>}
                  {foundAddress.city && <p className="text-sm">{foundAddress.city} - {foundAddress.state}</p>}
                  {foundAddress.zipcode && <p className="text-sm">CEP: {foundAddress.zipcode}</p>}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Resultados da Busca */}
        {searchResults.length > 0 && !showPersonForm && (
          <Card className="bg-white/90 backdrop-blur-sm border-slate-200/60">
            <CardHeader>
              <CardTitle>Pessoas Encontradas ({searchResults.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Telefone(s)</TableHead>
                    <TableHead>Endereço Completo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {searchResults.map(person => (
                    <TableRow key={person.id}>
                      <TableCell className="font-medium">{person.name}</TableCell>
                      <TableCell>{getTypeBadge(person.type)}</TableCell>
                      <TableCell>{person.phone?.join(', ')}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{person.address?.street}{person.address?.number ? `, ${person.address.number}` : ''}</p>
                          <p className="text-slate-500">
                            {person.address?.neighborhood && <span>{person.address.neighborhood}</span>}
                          </p>
                          <p className="text-slate-500">
                            {person.address?.city} - {person.address?.state}
                            {person.address?.zipcode && ` - CEP: ${person.address.zipcode}`}
                          </p>
                          {person.address?.referencePoint && <p className="text-xs text-slate-400">Ref: {person.address.referencePoint}</p>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={person.active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                          {person.active ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          onClick={() => handleSelectPerson(person)}
                          className="bg-blue-600 hover:bg-blue-700"
                          size="sm"
                        >
                          Usar no Pedido
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Mensagem quando não há busca ativa */}
        {searchResults.length === 0 && !foundAddress && !showPersonForm && (
          <Card className="bg-white/90 backdrop-blur-sm border-slate-200/60">
            <CardContent className="text-center py-12">
              <MapPin className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-600 mb-2">Busca por Endereço</h3>
              <p className="text-slate-500">
                Use o formulário acima para buscar pessoas por CEP ou endereço.<br />
                Se não encontrarmos ninguém, abriremos automaticamente o cadastro para você.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
