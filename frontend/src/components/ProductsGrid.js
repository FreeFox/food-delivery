import { Link as RouterLink } from 'react-router-dom';
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
  Flex,
  Link
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
            overflow="hidden"
          >
            <Link as={RouterLink} to={`/product/${product.id}`} _hover={{ textDecoration: 'none' }}>
              <Image
                src={product.image}
                alt={product.name}
                h="200px"
                objectFit="cover"
                cursor="pointer"
                _hover={{ opacity: 0.9 }}
              />
            </Link>
            <CardBody>
              <Stack spacing={2}>
                <Link
                  as={RouterLink}
                  to={`/product/${product.id}`}
                  _hover={{ textDecoration: 'none' }}
                >
                  <Heading size="md" _hover={{ color: 'red.500' }}>
                    {product.name}
                  </Heading>
                </Link>
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
