import {
  Box,
  SimpleGrid,
  Card,
  CardBody,
  Image,
  Stack,
  Text,
  Heading,
  HStack,
  Button,
  Flex
} from '@chakra-ui/react';
import { StarIcon } from '@chakra-ui/icons';

function ProductsGrid({ products, cart, onAddToCart }) {
  return (
    <Box>
      <Heading mb={6} size="lg">
        Featured Items
      </Heading>
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
        {products.map((product) => (
          <Card
            key={product.id}
            bg="white"
            _hover={{ boxShadow: 'lg', transform: 'translateY(-4px)' }}
            transition="all 0.3s"
          >
            <Image
              src={product.image}
              alt={product.name}
              h="200px"
              objectFit="cover"
            />
            <CardBody>
              <Stack spacing={2}>
                <Heading size="md">{product.name}</Heading>
                <HStack>
                  <StarIcon color="orange.400" />
                  <Text fontSize="sm">{product.rating}</Text>
                </HStack>
                <Flex justify="space-between" align="center">
                  <Text fontWeight="bold" fontSize="lg" color="red.500">
                    ${product.price}
                  </Text>
                  <Button
                    colorScheme="red"
                    size="sm"
                    onClick={() => onAddToCart(product)}
                  >
                    Add
                  </Button>
                </Flex>
              </Stack>
            </CardBody>
          </Card>
        ))}
      </SimpleGrid>
    </Box>
  );
}

export default ProductsGrid;
