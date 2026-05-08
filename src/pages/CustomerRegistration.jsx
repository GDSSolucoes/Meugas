import React, { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserPlus, Plus, Trash2, Loader2 } from "lucide-react";
import { Person } from "@/entities/Person";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User } from "@/entities/User";
import FiscalProvider from "@/providers/FiscalProvider";

const initialPersonState = {
  name: "",
  document: "",
  email: "",
  birthday: "",
  phone: [""],
  type: "cliente",
  address: {
    zipcode: "",
    street: "",
    number: "",
    complement: "", // Added new field
    neighborhood: "",
    referencePoint: "",
    city: "",
    state: "",
  },
  glpConsumptionDays: "", // Added new field
  conveniadaId: "",
  conveniadaName: "",
  active: true,
  createdByName: "",
  companyId: "",
  companyName: "",
};

export default function CustomerRegistrationPage() {
  const [currentPerson, setCurrentPerson] = useState(initialPersonState);
  const [isLoading, setIsLoading] = useState(false);
  const [isFromGerencial, setIsFromGerencial] = useState(false);
  const [conveniadas, setConveniadas] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [isAddressLoading, setIsAddressLoading] = useState(false);
  const debounceTimeout = useRef(null);
  const [currentUser, setCurrentUser] = useState(null);

  const loadConveniadas = async (companyId) => {
    if (!companyId) return;
    try {
      const allPeople = await Person.filter({ companyId: companyId });
      setConveniadas(
        allPeople.filter((p) => p.type === "conveniada" && p.active),
      );
    } catch (error) {
      console.error("Erro ao carregar conveniadas:", error);
    }
  };

  const loadPersonForEditing = useCallback(
    async (personId, companyId) => {
      if (!personId || !companyId) return;
      try {
        const allPeople = await Person.filter({ companyId: companyId });
        const personToEdit = allPeople.find((p) => p.id === personId);
        if (personToEdit) {
          // Ensure phone array is at least [''] if empty from backend
          if (!personToEdit.phone || personToEdit.phone.length === 0) {
            personToEdit.phone = [""];
          }
          // Ensure address.complement exists
          if (!personToEdit.address.complement) {
            personToEdit.address.complement = "";
          }
          // Ensure glpConsumptionDays exists and is a number or empty string
          if (
            typeof personToEdit.glpConsumptionDays === "undefined" ||
            personToEdit.glpConsumptionDays === null
          ) {
            personToEdit.glpConsumptionDays = "";
          }
          if (!personToEdit.birthday) {
            personToEdit.birthday = "";
          }

          setCurrentPerson(personToEdit);
          setIsEditing(true);
        } else {
          console.warn(`Pessoa com ID ${personId} não encontrada.`);
          // Optionally, redirect or clear edit mode if not found
          window.history.replaceState(
            {},
            document.title,
            window.location.pathname +
              (isFromGerencial ? "?module=gerencial" : ""),
          );
          setIsEditing(false);
          setCurrentPerson(initialPersonState);
        }
      } catch (error) {
        console.error("Erro ao carregar pessoa para edição:", error);
        // Fallback to creation mode or handle error display
        setIsEditing(false);
        setCurrentPerson(initialPersonState);
      }
    },
    [isFromGerencial],
  );

  useEffect(() => {
    const initialize = async () => {
      const user = await User.me();
      setCurrentUser(user);

      // Check URL parameter to determine module context
      const urlParams = new URLSearchParams(window.location.search);
      const moduleParam = urlParams.get("module");
      const editParam = urlParams.get("edit");
      const typeParam = urlParams.get("type");

      setIsFromGerencial(moduleParam === "gerencial");

      // Se veio com tipo pré-definido, setar o tipo
      if (
        typeParam &&
        ["cliente", "fornecedor", "pontoVenda", "conveniada"].includes(
          typeParam,
        )
      ) {
        setCurrentPerson((prev) => ({ ...prev, type: typeParam }));
      }

      // Load conveniadas and person for editing based on current user's companyId
      if (user.companyId) {
        loadConveniadas(user.companyId);
        if (editParam) {
          loadPersonForEditing(editParam, user.companyId);
        }
      }
    };
    initialize();
  }, [loadPersonForEditing]);

  const handleStreetChange = (value) => {
    setCurrentPerson((prev) => ({
      ...prev,
      address: { ...prev.address, street: value.toUpperCase() },
    }));

    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    // Only search if street has at least 3 characters and city/state are provided
    if (
      value.length >= 3 &&
      currentPerson.address.city &&
      currentPerson.address.state
    ) {
      setIsAddressLoading(true);
      debounceTimeout.current = setTimeout(async () => {
        try {
          const suggestions = await FiscalProvider.searchAddressByStreet({
            state: currentPerson.address.state,
            city: currentPerson.address.city,
            street: value,
          });
          setAddressSuggestions(suggestions || []);
        } catch (error) {
          console.error("Erro ao buscar sugestões de endereço:", error);
          setAddressSuggestions([]);
        } finally {
          setIsAddressLoading(false);
        }
      }, 500); // 500ms debounce
    } else {
      setAddressSuggestions([]); // Clear suggestions if conditions not met
      setIsAddressLoading(false); // Ensure loading is off if not searching
    }
  };

  const handleSelectAddress = (suggestion) => {
    setCurrentPerson((prev) => ({
      ...prev,
      address: {
        ...prev.address,
        zipcode: suggestion.cep,
        street: suggestion.street.toUpperCase(),
        neighborhood: suggestion.neighborhood.toUpperCase(),
        city: suggestion.city.toUpperCase(),
        state: suggestion.state.toUpperCase(),
        // Complement is not usually returned by CEP APIs, so it remains as is or empty
        complement: prev.address.complement || "",
      },
    }));
    setAddressSuggestions([]); // Clear suggestions after selection
  };

  const searchAddressByCEP = async (cep) => {
    if (cep.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await response.json();
        if (!data.erro) {
          setCurrentPerson((prev) => ({
            ...prev,
            address: {
              ...prev.address,
              street: (data.logradouro || "").toUpperCase(),
              neighborhood: (data.bairro || "").toUpperCase(),
              city: (data.localidade || "").toUpperCase(),
              state: (data.uf || "").toUpperCase(),
              complement: prev.address.complement || "", // Preserve existing complement if any, or keep empty
            },
          }));
        } else {
          // Clear address fields if CEP search fails
          setCurrentPerson((prev) => ({
            ...prev,
            address: {
              street: "",
              neighborhood: "",
              city: "",
              state: "",
              complement: "", // Clear complement on failed CEP search
            },
          }));
          console.warn("CEP não encontrado.");
        }
      } catch (error) {
        console.error("Erro ao buscar CEP:", error);
        // Clear address fields on network error
        setCurrentPerson((prev) => ({
          ...prev,
          address: {
            street: "",
            neighborhood: "",
            city: "",
            state: "",
            complement: "", // Clear complement on network error
          },
        }));
      }
    }
  };

  const handleSavePerson = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      alert("Erro: Usuário não identificado. Por favor, recarregue a página.");
      return;
    }
    setIsLoading(true);
    try {
      // Filter out empty phone numbers before saving
      const phonesToSave = currentPerson.phone.filter(
        (phone) => phone.trim() !== "",
      );

      let personToSave = {
        ...currentPerson,
        phone: phonesToSave.length > 0 ? phonesToSave : [""],
        companyId: currentUser.companyId,
        companyName: currentUser.companyName,
        createdByName: currentUser.name,
      };

      // Ensure optional fields are null if empty
      if (personToSave.glpConsumptionDays === "") {
        personToSave.glpConsumptionDays = null;
      }
      if (personToSave.birthday === "") {
        personToSave.birthday = null;
      }

      if (isEditing) {
        const { id, ...personData } = personToSave;
        await Person.update(id, personData);
        alert("Pessoa atualizada com sucesso!");

        if (isFromGerencial) {
          window.location.href = createPageUrl("People"); // Redirect to the people list page
        } else {
          resetForm(); // For non-gerencial, just reset the form
        }
      } else {
        // Generate sequential person number for new persons
        const allPersons = await Person.filter({
          companyId: currentUser.companyId,
        });
        const maxPersonNumber = allPersons.reduce((max, person) => {
          const currentNum = parseInt(person.personNumber, 10);
          return !isNaN(currentNum) && currentNum > max ? currentNum : max;
        }, 0);
        const newPersonNumber = maxPersonNumber + 1;

        personToSave = {
          ...personToSave,
          personNumber: String(newPersonNumber),
        };

        const newPerson = await Person.create(personToSave); // Store the returned new person object
        alert(
          isFromGerencial
            ? "Pessoa cadastrada com sucesso!"
            : "Cliente cadastrado com sucesso!",
        );

        // Verificar se deve retornar para outra tela com a pessoa selecionada
        const urlParams = new URLSearchParams(window.location.search);
        const returnTo = urlParams.get("return");

        if (returnTo === "purchases" && currentPerson.type === "fornecedor") {
          window.location.href = `${createPageUrl("Purchases")}?supplierId=${newPerson.id}`;
        } else if (returnTo === "cashMovements") {
          window.location.href = `${createPageUrl("CashMovements")}?personId=${newPerson.id}`;
        } else if (isFromGerencial) {
          resetForm(); // For gerencial, reset after creation
        } else {
          resetForm(); // For non-gerencial, reset after creation
        }
      }
    } catch (error) {
      console.error("Erro ao salvar pessoa:", error);
      alert("Erro ao salvar pessoa. Verifique os dados e tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setCurrentPerson(initialPersonState);
    setIsEditing(false);
    setAddressSuggestions([]); // Clear suggestions on reset
    // Clear URL parameters related to editing
    const urlParams = new URLSearchParams(window.location.search);
    urlParams.delete("edit");
    // Also remove the 'return' parameter if it exists
    urlParams.delete("return");
    const newSearch = urlParams.toString();
    const newUrl =
      window.location.pathname + (newSearch ? `?${newSearch}` : "");
    window.history.replaceState({}, document.title, newUrl);
  };

  const handlePhoneChange = (index, value) => {
    const newPhones = [...currentPerson.phone];
    newPhones[index] = value;
    setCurrentPerson((prev) => ({ ...prev, phone: newPhones }));
  };

  const addPhone = () => {
    setCurrentPerson((prev) => ({ ...prev, phone: [...prev.phone, ""] }));
  };

  const removePhone = (index) => {
    setCurrentPerson((prev) => {
      const newPhones = prev.phone.filter((_, i) => i !== index);
      // Ensure there's always at least one empty phone input if all are removed
      if (newPhones.length === 0) {
        return { ...prev, phone: [""] };
      }
      return { ...prev, phone: newPhones };
    });
  };

  const handleConveniadaChange = (conveniadaId) => {
    if (conveniadaId === "none") {
      // 'none' is a custom value for 'Nenhuma'
      setCurrentPerson((prev) => ({
        ...prev,
        conveniadaId: "",
        conveniadaName: "",
      }));
    } else {
      const conveniada = conveniadas.find((c) => c.id === conveniadaId);
      setCurrentPerson((prev) => ({
        ...prev,
        conveniadaId: conveniada ? conveniada.id : "",
        conveniadaName: conveniada ? conveniada.name : "",
      }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div
        className="max-w-4xl mx-auto"
        onBlur={() => setTimeout(() => setAddressSuggestions([]), 200)}
      >
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 mb-2">
              {isEditing ? "Editar Pessoa" : "Cadastro de Pessoas"}
            </h1>
            <p className="text-slate-600">
              {isFromGerencial
                ? "Cadastre clientes, fornecedores e pontos de venda"
                : "Cadastre novos clientes para seus pedidos"}
            </p>
          </div>
        </div>

        <Card className="bg-white/90 backdrop-blur-sm border-slate-200/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              {isEditing ? "Editar Pessoa" : "Cadastro de Pessoas"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSavePerson} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nome/Razão Social *</Label>
                  <Input
                    id="name"
                    value={currentPerson.name}
                    onChange={(e) =>
                      setCurrentPerson((prev) => ({
                        ...prev,
                        name: e.target.value.toUpperCase(),
                      }))
                    }
                    required
                    className="bg-white/80"
                  />
                </div>
                <div>
                  <Label htmlFor="document">CPF/CNPJ</Label>
                  <Input
                    id="document"
                    value={currentPerson.document}
                    onChange={(e) =>
                      setCurrentPerson((prev) => ({
                        ...prev,
                        document: e.target.value,
                      }))
                    }
                    className="bg-white/80"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={currentPerson.email}
                    onChange={(e) =>
                      setCurrentPerson((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                    className="bg-white/80"
                  />
                </div>
                <div>
                  <Label htmlFor="birthday">Data de Aniversário</Label>
                  <Input
                    id="birthday"
                    type="date"
                    value={currentPerson.birthday || ""}
                    onChange={(e) =>
                      setCurrentPerson((prev) => ({
                        ...prev,
                        birthday: e.target.value,
                      }))
                    }
                    className="bg-white/80"
                  />
                </div>
                <div>
                  <Label htmlFor="type">Tipo *</Label>
                  <Select
                    value={currentPerson.type}
                    onValueChange={(value) =>
                      setCurrentPerson((prev) => ({ ...prev, type: value }))
                    }
                  >
                    <SelectTrigger id="type" className="bg-white/80">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cliente">Cliente</SelectItem>
                      <SelectItem value="pontoVenda">Ponto de Venda</SelectItem>
                      <SelectItem value="fornecedor">Fornecedor</SelectItem>
                      <SelectItem value="conveniada">Conveniada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {currentPerson.type === "cliente" && (
                  <div>
                    <Label htmlFor="conveniada">
                      Empresa Conveniada (Opcional)
                    </Label>
                    <Select
                      value={currentPerson.conveniadaId || "none"}
                      onValueChange={handleConveniadaChange}
                    >
                      <SelectTrigger id="conveniada" className="bg-white/80">
                        <SelectValue placeholder="Selecione a empresa" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nenhuma</SelectItem>
                        {conveniadas.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Telefones</h3>
                <div className="space-y-2">
                  {currentPerson.phone.map((phone, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        value={phone}
                        onChange={(e) =>
                          handlePhoneChange(index, e.target.value)
                        }
                        placeholder="Ex: (11) 99999-9999"
                        className="bg-white/80"
                        type="tel"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        onClick={() => removePhone(index)}
                        disabled={currentPerson.phone.length === 1}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addPhone}
                  className="mt-2"
                >
                  <Plus className="w-4 h-4 mr-2" /> Adicionar Telefone
                </Button>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Endereço</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-1">
                    <Label htmlFor="zipcode">CEP</Label>
                    <Input
                      id="zipcode"
                      value={currentPerson.address.zipcode}
                      onChange={(e) => {
                        const cep = e.target.value.replace(/\D/g, "");
                        setCurrentPerson((prev) => ({
                          ...prev,
                          address: { ...prev.address, zipcode: cep },
                        }));
                        if (cep.length === 8) {
                          searchAddressByCEP(cep);
                        }
                      }}
                      placeholder="00000-000"
                      maxLength={8}
                      className="bg-white/80"
                      inputMode="numeric"
                    />
                  </div>
                  <div className="md:col-span-3 relative">
                    <Label htmlFor="street">Rua/Logradouro</Label>
                    <div className="relative">
                      <Input
                        id="street"
                        value={currentPerson.address.street}
                        onChange={(e) => handleStreetChange(e.target.value)}
                        className="bg-white/80"
                      />
                      {isAddressLoading && (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />
                      )}
                    </div>
                    {addressSuggestions.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {addressSuggestions.map((suggestion, index) => (
                          <div
                            key={`${suggestion.cep}-${suggestion.street}-${index}`}
                            className="p-2 cursor-pointer hover:bg-slate-100"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => handleSelectAddress(suggestion)}
                          >
                            <p className="font-medium">{suggestion.street}</p>
                            <p className="text-sm text-slate-500">
                              {suggestion.neighborhood}, {suggestion.city} -{" "}
                              {suggestion.cep}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="md:col-span-1">
                    <Label htmlFor="number">Número</Label>
                    <Input
                      id="number"
                      value={currentPerson.address.number}
                      onChange={(e) =>
                        setCurrentPerson((prev) => ({
                          ...prev,
                          address: {
                            ...prev.address,
                            number: e.target.value.toUpperCase(),
                          },
                        }))
                      }
                      className="bg-white/80"
                    />
                  </div>
                  <div className="md:col-span-1">
                    <Label htmlFor="complement">Complemento</Label>
                    <Input
                      id="complement"
                      value={currentPerson.address.complement}
                      onChange={(e) =>
                        setCurrentPerson((prev) => ({
                          ...prev,
                          address: {
                            ...prev.address,
                            complement: e.target.value.toUpperCase(),
                          },
                        }))
                      }
                      placeholder="Apto, Bloco, Casa..."
                      className="bg-white/80"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="neighborhood">Bairro</Label>
                    <Input
                      id="neighborhood"
                      value={currentPerson.address.neighborhood}
                      onChange={(e) =>
                        setCurrentPerson((prev) => ({
                          ...prev,
                          address: {
                            ...prev.address,
                            neighborhood: e.target.value.toUpperCase(),
                          },
                        }))
                      }
                      className="bg-white/80"
                    />
                  </div>
                  <div className="md:col-span-4">
                    <Label htmlFor="referencePoint">Ponto de Referência</Label>
                    <Input
                      id="referencePoint"
                      value={currentPerson.address.referencePoint}
                      onChange={(e) =>
                        setCurrentPerson((prev) => ({
                          ...prev,
                          address: {
                            ...prev.address,
                            referencePoint: e.target.value.toUpperCase(),
                          },
                        }))
                      }
                      className="bg-white/80"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="city">Cidade</Label>
                    <Input
                      id="city"
                      value={currentPerson.address.city}
                      onChange={(e) =>
                        setCurrentPerson((prev) => ({
                          ...prev,
                          address: {
                            ...prev.address,
                            city: e.target.value.toUpperCase(),
                          },
                        }))
                      }
                      className="bg-white/80"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="state">Estado (UF)</Label>
                    <Input
                      id="state"
                      value={currentPerson.address.state}
                      onChange={(e) =>
                        setCurrentPerson((prev) => ({
                          ...prev,
                          address: {
                            ...prev.address,
                            state: e.target.value.toUpperCase(),
                          },
                        }))
                      }
                      className="bg-white/80"
                      maxLength={2}
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">
                  Informações Complementares
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="glpConsumption">
                      Consumo GLP (dias) - Opcional
                    </Label>
                    <Input
                      id="glpConsumption"
                      type="number"
                      value={currentPerson.glpConsumptionDays || ""}
                      onChange={(e) =>
                        setCurrentPerson((prev) => ({
                          ...prev,
                          glpConsumptionDays:
                            e.target.value === ""
                              ? ""
                              : parseInt(e.target.value, 10) || "",
                        }))
                      }
                      placeholder="Ex: 30"
                      className="bg-white/80"
                      min="1"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Frequência em dias para troca do botijão (opcional)
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700"
                  disabled={isLoading}
                >
                  {isLoading
                    ? "Salvando..."
                    : isEditing
                      ? "Salvar Alterações"
                      : isFromGerencial
                        ? "Salvar Pessoa"
                        : "Salvar Cliente e Continuar"}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
                {isFromGerencial && (
                  <Link to={createPageUrl("People")}>
                    <Button type="button" variant="outline">
                      Voltar à Lista
                    </Button>
                  </Link>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
