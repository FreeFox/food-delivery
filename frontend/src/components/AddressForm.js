import { Box, Text, VStack, Input, Button } from '@chakra-ui/react';

export default function AddressForm({ savedAddress, addressForm, onAddressChange, onSaveAddress }) {
  return (
    <Box>
      <Text fontWeight="bold" mb={2}>
        Delivery Address
      </Text>
      {savedAddress && (
        <Box fontSize="sm" mb={2} p={2} bg="gray.50" borderRadius="md">
          <Text>{savedAddress.country}</Text>
          <Text>{savedAddress.city}</Text>
          <Text>
            {savedAddress.street} {savedAddress.number}
          </Text>
          {savedAddress.apartment && <Text>Apt {savedAddress.apartment}</Text>}
          {savedAddress.entrance && <Text>Entrance {savedAddress.entrance}</Text>}
          {savedAddress.floor && <Text>Floor {savedAddress.floor}</Text>}
        </Box>
      )}
      <VStack spacing={2} align="stretch">
        <Input placeholder="Country" size="sm" value={addressForm.country} isDisabled />
        <Input
          placeholder="City"
          size="sm"
          value={addressForm.city}
          onChange={(e) => onAddressChange({ ...addressForm, city: e.target.value })}
        />
        <Input
          placeholder="Street"
          size="sm"
          value={addressForm.street}
          onChange={(e) => onAddressChange({ ...addressForm, street: e.target.value })}
        />
        <Input
          placeholder="Number"
          size="sm"
          value={addressForm.number}
          onChange={(e) => onAddressChange({ ...addressForm, number: e.target.value })}
        />
        <Input
          placeholder="Apartment (optional)"
          size="sm"
          value={addressForm.apartment}
          onChange={(e) => onAddressChange({ ...addressForm, apartment: e.target.value })}
        />
        <Input
          placeholder="Entrance (optional)"
          size="sm"
          value={addressForm.entrance}
          onChange={(e) => onAddressChange({ ...addressForm, entrance: e.target.value })}
        />
        <Input
          placeholder="Floor (optional)"
          size="sm"
          value={addressForm.floor}
          onChange={(e) => onAddressChange({ ...addressForm, floor: e.target.value })}
        />
        <Button size="sm" colorScheme="blue" onClick={onSaveAddress}>
          Save Address
        </Button>
      </VStack>
    </Box>
  );
}
