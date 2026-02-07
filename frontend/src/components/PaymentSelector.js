import { Box, Text, VStack, Select, Button } from '@chakra-ui/react';

export default function PaymentSelector({ savedPayment, paymentMethod, onPaymentChange, onSavePayment }) {
  return (
    <Box>
      <Text fontWeight="bold" mb={2}>
        Payment Method
      </Text>
      {savedPayment && (
        <Box fontSize="sm" mb={2} p={2} bg="gray.50" borderRadius="md">
          <Text>{savedPayment.method}</Text>
        </Box>
      )}
      <VStack spacing={2} align="stretch">
        <Select value={paymentMethod} onChange={(e) => onPaymentChange(e.target.value)} size="sm">
          <option value="Credit card">Credit card</option>
          <option value="Cash">Cash</option>
        </Select>
        <Button size="sm" colorScheme="blue" onClick={onSavePayment}>
          Save Payment
        </Button>
      </VStack>
    </Box>
  );
}
