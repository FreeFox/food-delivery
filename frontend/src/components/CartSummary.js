import { Box, Text } from '@chakra-ui/react';

export default function CartSummary({ subtotal }) {
  return (
    <Box>
      <Text fontWeight="bold">Subtotal: ${subtotal.toFixed(2)}</Text>
    </Box>
  );
}
