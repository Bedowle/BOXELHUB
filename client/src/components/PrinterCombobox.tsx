import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export const PRINTER_OPTIONS = [
  { label: "Anycubic Kobra 2 Max", value: "AnycubicKobra2Max" },
  { label: "Anycubic Kobra 2 Pro", value: "AnycubicKobra2Pro" },
  { label: "Anycubic Kobra 3", value: "AnycubicKobra3" },
  { label: "Bambu Lab A1 Mini", value: "BambuLabA1Mini" },
  { label: "Bambu Lab P1S", value: "BambuLabP1S" },
  { label: "Bambu Lab X1 Carbon", value: "BambuLabX1Carbon" },
  { label: "Creality Ender 3 S1", value: "CrealityEnder3S1" },
  { label: "Creality Ender 3 V3", value: "CrealityEnder3V3" },
  { label: "Creality K1", value: "CrealityK1" },
  { label: "Elegoo Neptune 3", value: "ElegooNeptune3" },
  { label: "Flashforge Adventurer 5", value: "FlashforgeAdventurer5" },
  { label: "FLSUN S1", value: "FLsunS1" },
  { label: "FLSUN T1 Pro", value: "FLsunT1Pro" },
  { label: "Formlabs Form 3", value: "FormlabsForm3" },
  { label: "Kingroon KP3S", value: "KingroonKP3S" },
  { label: "Prusa MK4", value: "PrusaMK4" },
  { label: "Prusa MINI+", value: "PrusaMINI" },
  { label: "Prusa XL", value: "PrusaXL" },
  { label: "Ultimaker S5", value: "UltimakerS5" },
  { label: "Voxelab Aquila", value: "VoxelabAquila" },
]

interface PrinterComboboxProps {
  value: string
  onChange: (value: string) => void
  onCustomInput?: (customValue: string) => void
  placeholder?: string
  testId?: string
}

export function PrinterCombobox({
  value,
  onChange,
  onCustomInput,
  placeholder = "Busca o escribe tu impresora...",
  testId = "printer-combobox",
}: PrinterComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const [customInput, setCustomInput] = React.useState("")

  // Find the label for the current value
  const selectedLabel = PRINTER_OPTIONS.find((opt) => opt.value === value)?.label || value

  // Filter options based on search
  const filteredOptions = PRINTER_OPTIONS.filter((option) =>
    option.label.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          data-testid={testId}
        >
          <span className="truncate">
            {value && selectedLabel ? selectedLabel : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={placeholder}
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {filteredOptions.length === 0 && search && (
              <CommandEmpty className="p-4">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    No se encontró: "<strong>{search}</strong>"
                  </p>
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Usar nombre personalizado:</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        onChange(search)
                        onCustomInput?.(search)
                        setSearch("")
                        setOpen(false)
                      }}
                      className="w-full justify-center text-xs"
                    >
                      ✓ Usar "{search}"
                    </Button>
                  </div>
                </div>
              </CommandEmpty>
            )}
            {filteredOptions.length > 0 && (
              <CommandGroup>
                {filteredOptions.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={(currentValue) => {
                      onChange(currentValue === value ? "" : currentValue)
                      setOpen(false)
                      setSearch("")
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === option.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {option.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
