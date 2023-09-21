"use client";
import {
    ActionIcon,
    Badge,
    Collapse,
    Group,
    JsonInput,
    Stack,
    Table,
    Tabs,
    Text,
    Textarea,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import prettyMilliseconds from "pretty-ms";
import { FC } from "react";
import {
    TbAlphabetLatin,
    TbArrowRight,
    TbFileText,
    TbJson,
    TbX,
} from "react-icons/tb";
import { Hex, formatUnits, getAddress, hexToString } from "viem";
import { erc20PortalAddress, etherPortalAddress } from "@cartesi/rollups-wagmi";
import { InputItemFragment } from "../graphql";
import Address from "./address";

export type InputCardProps = {
    input: InputItemFragment;
};

export type MethodResolver = (
    input: InputItemFragment,
) => string | undefined | false;

const etherDepositResolver: MethodResolver = (input) =>
    getAddress(input.msgSender) === etherPortalAddress && "depositEther";
const erc20PortalResolver: MethodResolver = (input) =>
    getAddress(input.msgSender) === erc20PortalAddress && "depositERC20Tokens";

const resolvers: MethodResolver[] = [etherDepositResolver, erc20PortalResolver];
const methodResolver: MethodResolver = (input) => {
    for (const resolver of resolvers) {
        const method = resolver(input);
        if (method) return method;
    }
    return undefined;
};

const InputRow: FC<InputCardProps> = ({ input }) => {
    const [opened, { toggle }] = useDisclosure(false);
    const age = prettyMilliseconds(Date.now() - input.timestamp * 1000, {
        unitCount: 2,
        secondsDecimalDigits: 0,
        verbose: true,
    });

    const from = input.msgSender as Address;
    const to = input.application.id as Address;

    const erc20Deposit = (input: InputItemFragment) =>
        input.erc20Deposit ? (
            <Text size="xs">
                {formatUnits(
                    input.erc20Deposit.amount,
                    input.erc20Deposit.token.decimals,
                )}{" "}
                {input.erc20Deposit.token.symbol}
            </Text>
        ) : (
            <></>
        );

    const method = (
        <Badge variant="default" style={{ textTransform: "none" }}>
            {methodResolver(input) ?? "?"}
        </Badge>
    );
    return (
        <>
            <Table.Tr>
                <Table.Td>
                    {input.erc20Deposit ? (
                        <Group>
                            <Address
                                value={input.erc20Deposit.from as Address}
                                icon
                                shorten
                            />
                            <TbArrowRight />
                            <Address value={from} icon shorten />
                        </Group>
                    ) : (
                        <Address value={from} icon shorten />
                    )}
                </Table.Td>
                <Table.Td>
                    <Group justify="right">
                        {erc20Deposit(input)}
                        <TbArrowRight />
                    </Group>
                </Table.Td>
                <Table.Td>
                    <Address
                        value={to}
                        icon
                        href={`/applications/${to}`}
                        shorten
                    />
                </Table.Td>
                <Table.Td>{method}</Table.Td>
                <Table.Td>
                    <Text>{input.index}</Text>
                </Table.Td>
                <Table.Td>
                    <Text>{age} ago</Text>
                </Table.Td>
                <Table.Td>
                    <ActionIcon variant="default" onClick={toggle}>
                        {opened ? <TbX /> : <TbFileText />}
                    </ActionIcon>
                </Table.Td>
            </Table.Tr>
            <Table.Tr></Table.Tr>
            <Table.Tr>
                <Table.Td colSpan={8} p={0}>
                    <Collapse in={opened}>
                        <Tabs defaultValue="raw">
                            <Tabs.List>
                                <Tabs.Tab
                                    value="raw"
                                    leftSection={<TbFileText />}
                                >
                                    Raw
                                </Tabs.Tab>
                                <Tabs.Tab
                                    value="text"
                                    leftSection={<TbAlphabetLatin />}
                                >
                                    As Text
                                </Tabs.Tab>
                                <Tabs.Tab value="json" leftSection={<TbJson />}>
                                    As JSON
                                </Tabs.Tab>
                            </Tabs.List>

                            <Tabs.Panel value="raw">
                                <Textarea
                                    rows={10}
                                    value={input.payload}
                                    readOnly
                                />
                            </Tabs.Panel>

                            <Tabs.Panel value="text">
                                <Textarea
                                    rows={10}
                                    value={hexToString(input.payload as Hex)}
                                    readOnly
                                />
                            </Tabs.Panel>

                            <Tabs.Panel value="json">
                                <JsonInput
                                    rows={10}
                                    value={hexToString(input.payload as Hex)}
                                />
                            </Tabs.Panel>
                        </Tabs>
                    </Collapse>
                </Table.Td>
            </Table.Tr>
        </>
    );
};

export default InputRow;
